import type { Assignment, AssignmentStatus, AssignmentType, Priority } from '../types'

export type PrimaryView = 'home' | 'assignments' | 'calendar' | 'account'
export type View = PrimaryView | 'add' | 'details'
export type SortMode = 'nearest' | 'newest' | 'progress'

export const types: AssignmentType[] = ['بحث', 'تقرير', 'عرض تقديمي', 'واجب', 'مشروع', 'اختبار', 'أخرى']
export const priorities: Priority[] = ['منخفضة', 'متوسطة', 'عالية', 'عاجلة']
export const statuses: AssignmentStatus[] = ['لم يبدأ', 'جارٍ العمل', 'يحتاج معلومات', 'جاهز للمراجعة', 'مكتمل']

export const uid = () => crypto.randomUUID()

export const pct = (assignment: Assignment) => assignment.tasks.length
  ? Math.round((assignment.tasks.filter((task) => task.done).length / assignment.tasks.length) * 100)
  : assignment.status === 'مكتمل' ? 100 : 0

export const dateText = (iso: string) => new Intl.DateTimeFormat('ar-SA-u-ca-gregory', {
  dateStyle: 'medium',
  timeStyle: 'short'
}).format(new Date(iso))

export const dayText = (iso: string) => new Intl.DateTimeFormat('ar-SA-u-ca-gregory', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric'
}).format(new Date(iso))

export const timeText = (iso: string) => new Intl.DateTimeFormat('ar-SA', {
  hour: 'numeric',
  minute: '2-digit'
}).format(new Date(iso))

export const errorText = (error: unknown) => error instanceof Error ? error.message : 'حدث خطأ غير متوقع.'
export const isOverdue = (assignment: Assignment) => assignment.status !== 'مكتمل' && +new Date(assignment.dueAt) < Date.now()

const normalizeArabic = (value: string) => value
  .normalize('NFD')
  .replace(/[\u064B-\u065F\u0670]/g, '')
  .replace(/[أإآ]/g, 'ا')
  .replace(/ة/g, 'ه')
  .replace(/ى/g, 'ي')
  .toLowerCase()
  .trim()

export const matchesQuery = (assignment: Assignment, query: string) => {
  if (!query.trim()) return true
  const haystack = [
    assignment.title,
    assignment.course,
    assignment.instructor ?? '',
    assignment.type,
    assignment.priority,
    assignment.status,
    assignment.instructions,
    ...assignment.tasks.map((task) => task.title)
  ].join(' ')
  return normalizeArabic(haystack).includes(normalizeArabic(query))
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <div className="search-box">
    <span aria-hidden="true">⌕</span>
    <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    {value && <button aria-label="مسح البحث" onClick={() => onChange('')}>×</button>}
  </div>
}

export function AssignmentCard({ item, onClick }: { item: Assignment; onClick: () => void }) {
  return <button className={isOverdue(item) ? 'assignment-card overdue-card' : 'assignment-card'} onClick={onClick}>
    <div className="card-row"><div><h3>{item.title}</h3><p>{item.course}{item.instructor ? ` · ${item.instructor}` : ''}</p></div><span className={`priority priority-${item.priority}`}>{item.priority}</span></div>
    <div className="meta-tags"><span>{item.type}</span><span>{item.status}</span>{isOverdue(item) && <span className="overdue-badge">متأخر</span>}</div>
    <div className="progress-track small"><span style={{ width: `${pct(item)}%` }} /></div>
    <div className="card-row"><span>{dateText(item.dueAt)}</span><strong>{pct(item)}%</strong></div>
  </button>
}
