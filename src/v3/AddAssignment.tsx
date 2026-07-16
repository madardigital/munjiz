import { FormEvent, useState } from 'react'
import type { Assignment, AssignmentType, Priority, Task } from '../types'
import { priorities, types, uid } from './shared'

export default function AddAssignment({ onCancel, onCreate }: { onCancel: () => void; onCreate: (assignment: Assignment) => void }) {
  const [title, setTitle] = useState('')
  const [course, setCourse] = useState('')
  const [instructor, setInstructor] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [type, setType] = useState<AssignmentType>('بحث')
  const [priority, setPriority] = useState<Priority>('متوسطة')
  const [instructions, setInstructions] = useState('')
  const [taskInput, setTaskInput] = useState('')
  const [draftTasks, setDraftTasks] = useState<Task[]>([])

  const addTask = () => {
    if (!taskInput.trim()) return
    setDraftTasks((tasks) => [...tasks, { id: uid(), title: taskInput.trim(), done: false }])
    setTaskInput('')
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const tasks = draftTasks.length ? draftTasks : [
      { id: uid(), title: 'مراجعة التعليمات', done: false },
      { id: uid(), title: 'تنفيذ المحتوى', done: false },
      { id: uid(), title: 'المراجعة والتسليم', done: false }
    ]
    onCreate({ id: uid(), title: title.trim(), course: course.trim(), instructor: instructor.trim() || undefined, type, priority, dueAt: new Date(dueAt).toISOString(), status: 'لم يبدأ', instructions: instructions.trim(), createdAt: new Date().toISOString(), tasks })
  }

  return <form className="form-page" onSubmit={submit}>
    <header className="form-header"><button type="button" className="back-button" onClick={onCancel}>→</button><h1>تكليف جديد</h1></header>
    <label>اسم التكليف<input required maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
    <label>اسم المادة<input required maxLength={120} value={course} onChange={(event) => setCourse(event.target.value)} /></label>
    <label>اسم الدكتور أو المدرب (اختياري)<input maxLength={120} value={instructor} onChange={(event) => setInstructor(event.target.value)} /></label>
    <div className="two-columns"><label>النوع<select value={type} onChange={(event) => setType(event.target.value as AssignmentType)}>{types.map((item) => <option key={item}>{item}</option>)}</select></label><label>الأولوية<select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>{priorities.map((item) => <option key={item}>{item}</option>)}</select></label></div>
    <label>موعد التسليم<input required type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></label>
    <label>التعليمات<textarea rows={5} value={instructions} onChange={(event) => setInstructions(event.target.value)} /></label>
    <section className="draft-tasks"><div className="section-head compact"><div><h2>خطوات العمل</h2><p>أضف المهام التي تريد تنفيذها داخل هذا التكليف.</p></div></div><div className="inline-form"><input value={taskInput} onChange={(event) => setTaskInput(event.target.value)} placeholder="مثال: جمع المصادر" onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addTask() } }} /><button type="button" onClick={addTask}>＋</button></div>{draftTasks.length > 0 && <div className="draft-task-list">{draftTasks.map((task) => <div key={task.id}><span>{task.title}</span><button type="button" onClick={() => setDraftTasks((tasks) => tasks.filter((item) => item.id !== task.id))}>×</button></div>)}</div>}{!draftTasks.length && <p className="form-note">إن لم تضف خطوات، سيُنشئ التطبيق ثلاث مهام أساسية تلقائيًا.</p>}</section>
    <button className="primary-button">حفظ التكليف</button><button type="button" className="secondary-button" onClick={onCancel}>إلغاء</button>
  </form>
}
