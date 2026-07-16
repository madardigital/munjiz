import { useState } from 'react'
import type { Assignment } from '../types'
import { AssignmentCard, dateText, isOverdue, matchesQuery, pct, SearchBox } from './shared'

export default function Home({ items, cloud, onAdd, onOpen, onSeeAll }: { items: Assignment[]; cloud: boolean; onAdd: () => void; onOpen: (id: string) => void; onSeeAll: () => void }) {
  const [query, setQuery] = useState('')
  const active = [...items].filter((item) => item.status !== 'مكتمل').sort((a, b) => +new Date(a.dueAt) - +new Date(b.dueAt))
  const done = items.filter((item) => item.status === 'مكتمل').length
  const overdue = items.filter(isOverdue).length
  const shown = query.trim() ? items.filter((item) => matchesQuery(item, query)) : [...items].sort((a, b) => +new Date(a.dueAt) - +new Date(b.dueAt)).slice(0, 4)

  return <>
    <header className="topbar"><div><span className="eyebrow">تطبيق الطلاب</span><h1>منجِز</h1></div><span className="sync-badge">{cloud ? 'سحابي' : 'محلي'}</span></header>
    <section className="welcome"><h2>رتّب تكليفاتك</h2><p>تابع المواعيد وابحث في كل أعمالك من مكان واحد.</p></section>
    <SearchBox value={query} onChange={setQuery} placeholder="ابحث بالعنوان أو المادة أو المهمة…" />
    {!query.trim() && active[0] && <section className="hero-card"><span className="muted">أقرب موعد</span><h3>{active[0].title}</h3><p>{active[0].course} — {dateText(active[0].dueAt)}</p><div className="progress-track"><span style={{ width: `${pct(active[0])}%` }} /></div><button className="primary-button" onClick={() => onOpen(active[0].id)}>متابعة التكليف</button></section>}
    {!query.trim() && <div className="stats-grid three"><div className="stat"><strong>{active.length}</strong><span>قيد المتابعة</span></div><div className="stat"><strong>{done}</strong><span>مكتملة</span></div><div className={overdue ? 'stat attention' : 'stat'}><strong>{overdue}</strong><span>متأخرة</span></div></div>}
    {!query.trim() && <button className="wide-add" onClick={onAdd}>＋ إضافة تكليف جديد</button>}
    <div className="section-head"><h2>{query.trim() ? `نتائج البحث (${shown.length})` : 'أحدث التكليفات'}</h2>{!query.trim() && <button className="link-button" onClick={onSeeAll}>عرض الكل</button>}</div>
    <div className="assignment-stack">{shown.map((item) => <AssignmentCard key={item.id} item={item} onClick={() => onOpen(item.id)} />)}</div>
    {!shown.length && <div className="empty-state"><h3>لا توجد نتائج</h3><p>جرّب كلمة أخرى أو أضف تكليفًا جديدًا.</p></div>}
  </>
}
