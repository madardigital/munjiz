import { FormEvent, useState } from 'react'
import type { Assignment, AssignmentStatus } from '../types'
import { dateText, pct, statuses, uid } from './shared'

export default function Details({ item, onBack, onUpdate, onDelete }: { item: Assignment; onBack: () => void; onUpdate: (assignment: Assignment) => void; onDelete: () => void }) {
  const [task, setTask] = useState('')
  const add = (event: FormEvent) => { event.preventDefault(); if (!task.trim()) return; onUpdate({ ...item, tasks: [...item.tasks, { id: uid(), title: task.trim(), done: false }] }); setTask('') }

  return <>
    <header className="details-header"><button className="back-button" onClick={onBack}>→</button><div><span className="eyebrow">{item.course}</span><h1>{item.title}</h1></div></header>
    <section className="details-summary"><div className="progress-number">{pct(item)}%</div><div className="progress-track"><span style={{ width: `${pct(item)}%` }} /></div><p>{dateText(item.dueAt)}</p></section>
    <section className="panel"><div className="section-head compact"><h2>المهام</h2><span className="muted">{item.tasks.filter((taskItem) => taskItem.done).length}/{item.tasks.length}</span></div><div className="task-list">{item.tasks.map((taskItem) => <div className={taskItem.done ? 'task done' : 'task'} key={taskItem.id}><label><input type="checkbox" checked={taskItem.done} onChange={() => onUpdate({ ...item, tasks: item.tasks.map((entry) => entry.id === taskItem.id ? { ...entry, done: !entry.done } : entry) })} /><span>{taskItem.title}</span></label><button className="task-delete" onClick={() => onUpdate({ ...item, tasks: item.tasks.filter((entry) => entry.id !== taskItem.id) })}>×</button></div>)}</div><form className="inline-form" onSubmit={add}><input value={task} onChange={(event) => setTask(event.target.value)} placeholder="أضف مهمة" /><button>＋</button></form></section>
    <section className="panel"><h2>بيانات التكليف</h2><div className="details-grid"><div><span>النوع</span><strong>{item.type}</strong></div><div><span>الأولوية</span><strong>{item.priority}</strong></div>{item.instructor && <div><span>الدكتور</span><strong>{item.instructor}</strong></div>}<div><span>الحالة</span><strong>{item.status}</strong></div></div></section>
    <section className="panel"><h2>التعليمات</h2><p className="instructions">{item.instructions || 'لم تُضف تعليمات.'}</p></section>
    <label className="status-control">الحالة<select value={item.status} onChange={(event) => onUpdate({ ...item, status: event.target.value as AssignmentStatus })}>{statuses.map((statusItem) => <option key={statusItem}>{statusItem}</option>)}</select></label>
    <button className="secondary-button danger" onClick={() => window.confirm('حذف التكليف؟') && onDelete()}>حذف التكليف</button>
  </>
}
