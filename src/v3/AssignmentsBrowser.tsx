import { useMemo, useState } from 'react'
import type { Assignment, AssignmentStatus, AssignmentType, Priority } from '../types'
import { AssignmentCard, matchesQuery, priorities, SearchBox, statuses, type SortMode, types } from './shared'

export default function AssignmentsBrowser({ items, onAdd, onOpen }: { items: Assignment[]; onAdd: () => void; onOpen: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'الكل' | AssignmentStatus>('الكل')
  const [priority, setPriority] = useState<'الكل' | Priority>('الكل')
  const [type, setType] = useState<'الكل' | AssignmentType>('الكل')
  const [sort, setSort] = useState<SortMode>('nearest')

  const filtered = useMemo(() => {
    const result = items.filter((item) => matchesQuery(item, query) && (status === 'الكل' || item.status === status) && (priority === 'الكل' || item.priority === priority) && (type === 'الكل' || item.type === type))
    return [...result].sort((a, b) => sort === 'newest' ? +new Date(b.createdAt) - +new Date(a.createdAt) : sort === 'progress' ? b.tasks.filter((task) => task.done).length - a.tasks.filter((task) => task.done).length : +new Date(a.dueAt) - +new Date(b.dueAt))
  }, [items, query, status, priority, type, sort])

  const clearFilters = () => { setQuery(''); setStatus('الكل'); setPriority('الكل'); setType('الكل'); setSort('nearest') }

  return <>
    <header className="simple-header"><div><span className="eyebrow">إدارة كاملة</span><h1>التكليفات</h1></div><button className="icon-button" onClick={onAdd}>＋</button></header>
    <SearchBox value={query} onChange={setQuery} placeholder="ابحث في العنوان، المادة، الدكتور، التعليمات…" />
    <section className="filter-panel"><div className="filter-grid">
      <label>الحالة<select value={status} onChange={(event) => setStatus(event.target.value as 'الكل' | AssignmentStatus)}><option>الكل</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label>الأولوية<select value={priority} onChange={(event) => setPriority(event.target.value as 'الكل' | Priority)}><option>الكل</option>{priorities.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label>النوع<select value={type} onChange={(event) => setType(event.target.value as 'الكل' | AssignmentType)}><option>الكل</option>{types.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label>الترتيب<select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}><option value="nearest">الأقرب موعدًا</option><option value="newest">الأحدث إضافة</option><option value="progress">الأعلى إنجازًا</option></select></label>
    </div><div className="results-row"><strong>{filtered.length} تكليف</strong><button className="link-button" onClick={clearFilters}>مسح الفلاتر</button></div></section>
    <div className="assignment-stack">{filtered.map((item) => <AssignmentCard key={item.id} item={item} onClick={() => onOpen(item.id)} />)}</div>
    {!filtered.length && <div className="empty-state"><h3>لا توجد نتائج مطابقة</h3><p>غيّر كلمة البحث أو أحد الفلاتر.</p></div>}
  </>
}
