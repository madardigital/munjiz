import { FormEvent, useMemo, useState } from 'react'
import type { Priority, WorkOrder, WorkTask } from './types'
import { priorities } from './types'
import { dateText } from './shared'

export default function TasksView({ orders, standaloneTasks, onToggle, onAdd, onDelete }: { orders: WorkOrder[]; standaloneTasks: WorkTask[]; onToggle: (task: WorkTask) => Promise<void>; onAdd: (input: { orderId?: string; title: string; dueAt?: string; priority: Priority; notes?: string }) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState('')
  const [orderId, setOrderId] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [priority, setPriority] = useState<Priority>('متوسطة')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [filter, setFilter] = useState<'pending' | 'all' | 'done'>('pending')

  const allTasks = useMemo(() => {
    const attached = orders.flatMap((order) => order.tasks.map((task) => ({ ...task, orderTitle: order.title, clientName: order.clientName })))
    const standalone = standaloneTasks.map((task) => ({ ...task, orderTitle: 'مهمة شخصية', clientName: '' }))
    return [...attached, ...standalone].filter((task) => filter === 'all' || (filter === 'done' ? task.done : !task.done)).sort((a, b) => {
      if (!a.dueAt && !b.dueAt) return +new Date(b.createdAt) - +new Date(a.createdAt)
      if (!a.dueAt) return 1
      if (!b.dueAt) return -1
      return +new Date(a.dueAt) - +new Date(b.dueAt)
    })
  }, [orders, standaloneTasks, filter])

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true)
    try {
      await onAdd({ orderId: orderId || undefined, title: title.trim(), dueAt: dueAt ? new Date(dueAt).toISOString() : undefined, priority, notes: notes.trim() })
      setTitle(''); setOrderId(''); setDueAt(''); setPriority('متوسطة'); setNotes(''); setShowAdd(false)
    } finally { setBusy(false) }
  }

  return <>
    <header className="om-header"><div><span className="om-eyebrow">التنفيذ اليومي</span><h1>مهامي</h1></div><button className="om-icon-button" onClick={() => setShowAdd((value) => !value)}>＋</button></header>
    <div className="om-segmented"><button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>غير مكتملة</button><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>الكل</button><button className={filter === 'done' ? 'active' : ''} onClick={() => setFilter('done')}>مكتملة</button></div>
    {showAdd && <form className="om-quick-form" onSubmit={submit}><h2>مهمة جديدة</h2><label>عنوان المهمة<input required value={title} onChange={(event) => setTitle(event.target.value)} /></label><label>ربط بطلب<select value={orderId} onChange={(event) => setOrderId(event.target.value)}><option value="">مهمة شخصية</option>{orders.map((order) => <option key={order.id} value={order.id}>{order.title} — {order.clientName}</option>)}</select></label><div className="om-two"><label>الموعد<input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></label><label>الأولوية<select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>{priorities.map((item) => <option key={item}>{item}</option>)}</select></label></div><label>ملاحظات<textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} /></label><button className="om-primary" disabled={busy}>{busy ? 'جارٍ الحفظ…' : 'إضافة المهمة'}</button></form>}
    <div className="om-task-list">{allTasks.map((task) => <article className={task.done ? 'om-task-item done' : 'om-task-item'} key={task.id}><label><input type="checkbox" checked={task.done} onChange={() => void onToggle({ ...task, done: !task.done })} /><div><strong>{task.title}</strong><span>{task.orderTitle}{task.clientName ? ` · ${task.clientName}` : ''}</span><small>{dateText(task.dueAt)} · {task.priority}</small>{task.notes && <p>{task.notes}</p>}</div></label><button className="om-delete-mini" onClick={() => window.confirm('حذف المهمة؟') && void onDelete(task.id)}>×</button></article>)}</div>
    {!allTasks.length && <div className="om-empty"><h3>لا توجد مهام في هذا القسم</h3><p>أضف مهمة شخصية أو اربطها بطلب.</p></div>}
  </>
}
