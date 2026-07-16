import type { User } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import type { Assignment, AssignmentType, Priority, AssignmentStatus, Task } from './types'

type AssignmentRow = {
  id: string
  title: string
  course: string
  instructor: string | null
  assignment_type: AssignmentType
  due_at: string
  priority: Priority
  status: AssignmentStatus
  instructions: string
  created_at: string
  tasks: TaskRow[] | null
}

type TaskRow = {
  id: string
  title: string
  is_done: boolean
  position: number
}

function client() {
  if (!supabase) throw new Error('Supabase غير مهيأ')
  return supabase
}

function toAssignment(row: AssignmentRow): Assignment {
  return {
    id: row.id,
    title: row.title,
    course: row.course,
    instructor: row.instructor ?? undefined,
    type: row.assignment_type,
    dueAt: row.due_at,
    priority: row.priority,
    status: row.status,
    instructions: row.instructions,
    createdAt: row.created_at,
    tasks: [...(row.tasks ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((task) => ({ id: task.id, title: task.title, done: task.is_done }))
  }
}

function assignmentPayload(assignment: Assignment, userId: string) {
  return {
    id: assignment.id,
    user_id: userId,
    title: assignment.title,
    course: assignment.course,
    instructor: assignment.instructor ?? null,
    assignment_type: assignment.type,
    due_at: assignment.dueAt,
    priority: assignment.priority,
    status: assignment.status,
    instructions: assignment.instructions,
    created_at: assignment.createdAt,
    updated_at: new Date().toISOString()
  }
}

function taskPayload(task: Task, assignmentId: string, userId: string, position: number) {
  return {
    id: task.id,
    assignment_id: assignmentId,
    user_id: userId,
    title: task.title,
    is_done: task.done,
    position,
    updated_at: new Date().toISOString()
  }
}

export async function fetchCloudAssignments(): Promise<Assignment[]> {
  const { data, error } = await client()
    .from('assignments')
    .select(`
      id,
      title,
      course,
      instructor,
      assignment_type,
      due_at,
      priority,
      status,
      instructions,
      created_at,
      tasks (id, title, is_done, position)
    `)
    .order('due_at', { ascending: true })

  if (error) throw error
  return ((data ?? []) as AssignmentRow[]).map(toAssignment)
}

export async function saveCloudAssignment(assignment: Assignment, user: User): Promise<void> {
  const db = client()
  const { error: assignmentError } = await db
    .from('assignments')
    .upsert(assignmentPayload(assignment, user.id), { onConflict: 'id' })

  if (assignmentError) throw assignmentError

  const { data: existingTasks, error: existingError } = await db
    .from('tasks')
    .select('id')
    .eq('assignment_id', assignment.id)

  if (existingError) throw existingError

  const currentIds = new Set(assignment.tasks.map((task) => task.id))
  const removedIds = (existingTasks ?? [])
    .map((item) => item.id as string)
    .filter((id) => !currentIds.has(id))

  if (removedIds.length) {
    const { error: deleteError } = await db.from('tasks').delete().in('id', removedIds)
    if (deleteError) throw deleteError
  }

  if (assignment.tasks.length) {
    const rows = assignment.tasks.map((task, index) => taskPayload(task, assignment.id, user.id, index))
    const { error: taskError } = await db.from('tasks').upsert(rows, { onConflict: 'id' })
    if (taskError) throw taskError
  }
}

export async function deleteCloudAssignment(id: string): Promise<void> {
  const { error } = await client().from('assignments').delete().eq('id', id)
  if (error) throw error
}

export async function updateCloudProfile(displayName: string): Promise<void> {
  const db = client()
  const { data: userData, error: userError } = await db.auth.getUser()
  if (userError || !userData.user) throw userError ?? new Error('تعذر قراءة الحساب')

  const { error } = await db
    .from('profiles')
    .upsert({ id: userData.user.id, display_name: displayName.trim(), updated_at: new Date().toISOString() })

  if (error) throw error
  const { error: metadataError } = await db.auth.updateUser({ data: { display_name: displayName.trim() } })
  if (metadataError) throw metadataError
}
