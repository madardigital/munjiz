import type { WorkOrder } from './types'

export type View = 'home' | 'orders' | 'add' | 'details' | 'tasks' | 'account'

export const dateText = (iso?: string) => iso ? new Intl.DateTimeFormat('ar-SA-u-ca-gregory', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)) : 'بدون موعد'
export const shortDate = (iso?: string) => iso ? new Intl.DateTimeFormat('ar-SA-u-ca-gregory', { day: 'numeric', month: 'short' }).format(new Date(iso)) : '—'
export const money = (value: number) => new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 2 }).format(value || 0)
export const remaining = (order: WorkOrder) => Math.max(0, order.totalAmount - order.paidAmount)
export const isOverdue = (order: WorkOrder) => !['مكتمل ومدفوع','ملغي'].includes(order.status) && +new Date(order.dueAt) < Date.now()
export const isOpenOrder = (order: WorkOrder) => !['مكتمل ومدفوع','ملغي'].includes(order.status)
export const normalizePhone = (phone: string) => phone.replace(/\D/g, '').replace(/^00/, '')
export const progress = (order: WorkOrder) => order.tasks.length ? Math.round(order.tasks.filter((task) => task.done).length / order.tasks.length * 100) : 0
export const errorText = (error: unknown) => error instanceof Error ? error.message : 'حدث خطأ غير متوقع.'

export const whatsappTemplates = [
  {
    id: 'received', label: 'تأكيد استلام الطلب',
    build: (order: WorkOrder) => `مرحبًا ${order.clientName}،\nتم استلام طلبك: ${order.title}.\nموعد التسليم: ${dateText(order.dueAt)}.\nسأبلغك عند اكتمال كل مرحلة.`
  },
  {
    id: 'details', label: 'طلب التفاصيل والملفات',
    build: (order: WorkOrder) => `مرحبًا ${order.clientName}،\nلاستكمال طلب ${order.title} أحتاج إرسال جميع التعليمات والملفات المطلوبة، مع توضيح عدد الصفحات أو الشرائح وطريقة التوثيق وموعد التسليم.`
  },
  {
    id: 'quote', label: 'إرسال عرض السعر',
    build: (order: WorkOrder) => `مرحبًا ${order.clientName}،\nسعر تنفيذ طلب ${order.title}: ${money(order.totalAmount)}.\nموعد التسليم: ${dateText(order.dueAt)}.\nيبدأ التنفيذ بعد اعتماد التفاصيل والعربون.`
  },
  {
    id: 'deposit', label: 'طلب العربون',
    build: (order: WorkOrder) => `مرحبًا ${order.clientName}،\nلتأكيد بدء تنفيذ طلب ${order.title} يرجى تحويل العربون المتفق عليه.\nإجمالي الطلب: ${money(order.totalAmount)}.\nالمستلم: ${money(order.paidAmount)}.\nالمتبقي: ${money(remaining(order))}.`
  },
  {
    id: 'ready', label: 'الطلب جاهز للمراجعة',
    build: (order: WorkOrder) => `مرحبًا ${order.clientName}،\nتم الانتهاء من طلب ${order.title} وأصبح جاهزًا للمراجعة. أرسل ملاحظاتك مجمعة وواضحة حتى يتم تنفيذ التعديلات المطلوبة.`
  },
  {
    id: 'remaining', label: 'تذكير بالمبلغ المتبقي',
    build: (order: WorkOrder) => `مرحبًا ${order.clientName}،\nتذكير بالمبلغ المتبقي لطلب ${order.title}: ${money(remaining(order))}.\nالمبلغ الإجمالي: ${money(order.totalAmount)}، والمدفوع: ${money(order.paidAmount)}.`
  },
  {
    id: 'delivered', label: 'تأكيد التسليم',
    build: (order: WorkOrder) => `مرحبًا ${order.clientName}،\nتم تسليم طلب ${order.title}. شكرًا لتعاملك، وأرجو التأكد من تحميل الملفات وحفظها. يسعدني معرفة تقييمك للخدمة.`
  }
] as const

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <div className="om-search"><span>⌕</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />{value && <button onClick={() => onChange('')}>×</button>}</div>
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`om-status status-${status.replaceAll(' ', '-')}`}>{status}</span>
}

export function OrderCard({ order, onClick }: { order: WorkOrder; onClick: () => void }) {
  return <button className={isOverdue(order) ? 'om-order-card overdue' : 'om-order-card'} onClick={onClick}>
    <div className="om-card-top"><div><h3>{order.title}</h3><p>{order.clientName} · {order.serviceType}</p></div><StatusBadge status={order.status} /></div>
    <div className="om-card-meta"><span>التسليم: {shortDate(order.dueAt)}</span><span>{money(remaining(order))} متبقي</span></div>
    <div className="om-progress"><span style={{ width: `${progress(order)}%` }} /></div>
    <div className="om-card-bottom"><span className={`priority-${order.priority}`}>{order.priority}</span><strong>{progress(order)}%</strong></div>
  </button>
}

export function Loading() {
  return <div className="om-loading"><div className="om-spinner" /><p>جارٍ التحميل…</p></div>
}
