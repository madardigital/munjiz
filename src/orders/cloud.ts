import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { NewOrder, OrderStatus, Payment, Priority, ServiceType, WorkOrder, WorkTask } from './types'

type Workspace = { orders: WorkOrder[]; standaloneTasks: WorkTask[] }

type DbOrder = {
  id: string; client_name: string; phone: string; title: string; service_type: ServiceType; course_or_entity: string
  details: string; received_at: string; due_at: string; total_amount: number | string; paid_amount: number | string
  payment_method: string; status: OrderStatus; priority: Priority; notes: string; last_contact_at: string | null
  created_at: string; updated_at: string
}
type DbTask = { id: string; order_id: string | null; title: string; due_at: string | null; priority: Priority; done: boolean; notes: string; created_at: string }
type DbPayment = { id: string; order_id: string; amount: number | string; paid_at: string; method: string; note: string; created_at: string }

const client = () => {
  if (!supabase) throw new Error('الاتصال السحابي غير مهيأ.')
  return supabase
}

const mapTask = (row: DbTask): WorkTask => ({
  id: row.id,
  orderId: row.order_id || undefined,
  title: row.title,
  dueAt: row.due_at || undefined,
  priority: row.priority,
  done: row.done,
  notes: row.notes,
  createdAt: row.created_at
})

const mapPayment = (row: DbPayment): Payment => ({
  id: row.id,
  orderId: row.order_id,
  amount: Number(row.amount),
  paidAt: row.paid_at,
  method: row.method,
  note: row.note,
  createdAt: row.created_at
})

export async function fetchWorkspace(): Promise<Workspace> {
  const db = client()
  const [ordersResult, tasksResult, paymentsResult] = await Promise.all([
    db.from('work_orders').select('*').order('due_at', { ascending: true }),
    db.from('work_tasks').select('*').order('created_at', { ascending: false }),
    db.from('work_payments').select('*').order('paid_at', { ascending: false })
  ])
  if (ordersResult.error) throw ordersResult.error
  if (tasksResult.error) throw tasksResult.error
  if (paymentsResult.error) throw paymentsResult.error
  const tasks = (tasksResult.data as DbTask[]).map(mapTask)
  const payments = (paymentsResult.data as DbPayment[]).map(mapPayment)
  const orders = (ordersResult.data as DbOrder[]).map((row): WorkOrder => ({
    id: row.id,
    clientName: row.client_name,
    phone: row.phone,
    title: row.title,
    serviceType: row.service_type,
    courseOrEntity: row.course_or_entity,
    details: row.details,
    receivedAt: row.received_at,
    dueAt: row.due_at,
    totalAmount: Number(row.total_amount),
    paidAmount: Number(row.paid_amount),
    paymentMethod: row.payment_method,
    status: row.status,
    priority: row.priority,
    notes: row.notes,
    lastContactAt: row.last_contact_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tasks: tasks.filter((task) => task.orderId === row.id),
    payments: payments.filter((payment) => payment.orderId === row.id)
  }))
  return { orders, standaloneTasks: tasks.filter((task) => !task.orderId) }
}

export async function createOrder(input: NewOrder, user: User): Promise<string> {
  const db = client()
  const { data, error } = await db.from('work_orders').insert({
    user_id: user.id,
    client_name: input.clientName,
    phone: input.phone,
    title: input.title,
    service_type: input.serviceType,
    course_or_entity: input.courseOrEntity,
    details: input.details,
    received_at: input.receivedAt,
    due_at: input.dueAt,
    total_amount: input.totalAmount,
    paid_amount: input.paidAmount,
    payment_method: input.paymentMethod,
    status: input.status,
    priority: input.priority,
    notes: input.notes,
    last_contact_at: input.lastContactAt || null
  }).select('id').single()
  if (error) throw error
  const orderId = data.id as string
  if (input.taskTitles.length) {
    const { error: tasksError } = await db.from('work_tasks').insert(input.taskTitles.map((title) => ({
      user_id: user.id,
      order_id: orderId,
      title,
      due_at: input.dueAt,
      priority: input.priority,
      done: false,
      notes: ''
    })))
    if (tasksError) throw tasksError
  }
  if (input.paidAmount > 0) {
    const { error: paymentError } = await db.from('work_payments').insert({
      user_id: user.id,
      order_id: orderId,
      amount: input.paidAmount,
      paid_at: input.receivedAt,
      method: input.paymentMethod,
      note: 'دفعة أولى عند تسجيل الطلب'
    })
    if (paymentError) throw paymentError
  }
  return orderId
}

export async function updateOrder(order: WorkOrder): Promise<void> {
  const { error } = await client().from('work_orders').update({
    client_name: order.clientName,
    phone: order.phone,
    title: order.title,
    service_type: order.serviceType,
    course_or_entity: order.courseOrEntity,
    details: order.details,
    due_at: order.dueAt,
    total_amount: order.totalAmount,
    paid_amount: order.paidAmount,
    payment_method: order.paymentMethod,
    status: order.status,
    priority: order.priority,
    notes: order.notes,
    last_contact_at: order.lastContactAt || null
  }).eq('id', order.id)
  if (error) throw error
}

export async function deleteOrder(id: string): Promise<void> {
  const { error } = await client().from('work_orders').delete().eq('id', id)
  if (error) throw error
}

export async function createTask(input: { orderId?: string; title: string; dueAt?: string; priority: Priority; notes?: string }, user: User): Promise<void> {
  const { error } = await client().from('work_tasks').insert({
    user_id: user.id,
    order_id: input.orderId || null,
    title: input.title,
    due_at: input.dueAt || null,
    priority: input.priority,
    done: false,
    notes: input.notes || ''
  })
  if (error) throw error
}

export async function updateTask(task: WorkTask): Promise<void> {
  const { error } = await client().from('work_tasks').update({
    title: task.title,
    due_at: task.dueAt || null,
    priority: task.priority,
    done: task.done,
    notes: task.notes
  }).eq('id', task.id)
  if (error) throw error
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await client().from('work_tasks').delete().eq('id', id)
  if (error) throw error
}

export async function addPayment(input: { order: WorkOrder; amount: number; method: string; note: string }, user: User): Promise<void> {
  const db = client()
  const nextPaid = Math.min(input.order.totalAmount, input.order.paidAmount + input.amount)
  const { error: paymentError } = await db.from('work_payments').insert({
    user_id: user.id,
    order_id: input.order.id,
    amount: input.amount,
    method: input.method,
    note: input.note,
    paid_at: new Date().toISOString()
  })
  if (paymentError) throw paymentError
  const { error: orderError } = await db.from('work_orders').update({ paid_amount: nextPaid }).eq('id', input.order.id)
  if (orderError) throw orderError
}

export async function markContacted(orderId: string): Promise<void> {
  const { error } = await client().from('work_orders').update({ last_contact_at: new Date().toISOString() }).eq('id', orderId)
  if (error) throw error
}
