import type { Assignment } from '../types'
import { dayText, isOverdue, pct, timeText } from './shared'

export default function CalendarView({ items, onOpen }: { items: Assignment[]; onOpen: (id: string) => void }) {
  const sorted = [...items].sort((a, b) => +new Date(a.dueAt) - +new Date(b.dueAt))
  const today = new Date()
  const endOfWeek = new Date(today)
  endOfWeek.setDate(today.getDate() + 7)
  const dueToday = sorted.filter((item) => new Date(item.dueAt).toDateString() === today.toDateString() && item.status !== 'مكتمل').length
  const dueWeek = sorted.filter((item) => { const due = new Date(item.dueAt); return due >= today && due <= endOfWeek && item.status !== 'مكتمل' }).length
  const overdue = sorted.filter(isOverdue).length
  const groups = sorted.reduce<Record<string, Assignment[]>>((accumulator, item) => { const date = new Date(item.dueAt); const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`; accumulator[key] = [...(accumulator[key] ?? []), item]; return accumulator }, {})

  return <>
    <header className="simple-header"><div><span className="eyebrow">الجدول الزمني</span><h1>المواعيد</h1></div></header>
    <div className="stats-grid three calendar-stats"><div className="stat"><strong>{dueToday}</strong><span>اليوم</span></div><div className="stat"><strong>{dueWeek}</strong><span>خلال أسبوع</span></div><div className={overdue ? 'stat attention' : 'stat'}><strong>{overdue}</strong><span>متأخرة</span></div></div>
    {Object.values(groups).map((group) => <section className="calendar-group" key={group[0].dueAt.slice(0, 10)}><h2>{dayText(group[0].dueAt)}</h2><div className="timeline-list">{group.map((item) => <button className={isOverdue(item) ? 'timeline-card overdue' : 'timeline-card'} key={item.id} onClick={() => onOpen(item.id)}><div className="timeline-time">{timeText(item.dueAt)}</div><div className="timeline-content"><div className="card-row"><h3>{item.title}</h3>{isOverdue(item) && <span className="overdue-badge">متأخر</span>}</div><p>{item.course} · {item.type}</p><div className="progress-track small"><span style={{ width: `${pct(item)}%` }} /></div></div></button>)}</div></section>)}
    {!items.length && <div className="empty-state"><h3>لا توجد مواعيد</h3><p>ستظهر مواعيد التسليم هنا بعد إضافة التكليفات.</p></div>}
  </>
}
