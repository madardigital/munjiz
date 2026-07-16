import { useMemo, useState } from 'react'
import type { WorkOrder } from './types'
import { orderStatuses, serviceTypes } from './types'
import { OrderCard, SearchBox } from './shared'

export default function OrdersList({ orders, onAdd, onOpen }: { orders: WorkOrder[]; onAdd: () => void; onOpen: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('الكل')
  const [service, setService] = useState('الكل')
  const [sort, setSort] = useState<'due' | 'newest' | 'remaining'>('due')
  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase()
    return orders.filter((order) => {
      const haystack = `${order.clientName} ${order.phone} ${order.title} ${order.serviceType} ${order.courseOrEntity} ${order.details}`.toLowerCase()
      return (!text || haystack.includes(text)) && (status === 'الكل' || order.status === status) && (service === 'الكل' || order.serviceType === service)
    }).sort((a, b) => sort === 'newest' ? +new Date(b.createdAt) - +new Date(a.createdAt) : sort === 'remaining' ? (b.totalAmount - b.paidAmount) - (a.totalAmount - a.paidAmount) : +new Date(a.dueAt) - +new Date(b.dueAt))
  }, [orders, query, status, service, sort])

  return <>
    <header className="om-header"><div><span className="om-eyebrow">إدارة العملاء</span><h1>الطلبات</h1></div><button className="om-icon-button" onClick={onAdd}>＋</button></header>
    <SearchBox value={query} onChange={setQuery} placeholder="ابحث باسم العميل أو رقم الجوال أو الطلب…" />
    <section className="om-filters"><label>الحالة<select value={status} onChange={(event) => setStatus(event.target.value)}><option>الكل</option>{orderStatuses.map((item) => <option key={item}>{item}</option>)}</select></label><label>الخدمة<select value={service} onChange={(event) => setService(event.target.value)}><option>الكل</option>{serviceTypes.map((item) => <option key={item}>{item}</option>)}</select></label><label>الترتيب<select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}><option value="due">الأقرب تسليمًا</option><option value="newest">الأحدث إضافة</option><option value="remaining">الأعلى متبقيًا</option></select></label></section>
    <div className="om-results-row"><strong>{filtered.length} طلب</strong><button onClick={() => { setQuery(''); setStatus('الكل'); setService('الكل'); setSort('due') }}>مسح الفلاتر</button></div>
    <div className="om-stack">{filtered.map((order) => <OrderCard key={order.id} order={order} onClick={() => onOpen(order.id)} />)}</div>
    {!filtered.length && <div className="om-empty"><h3>لا توجد نتائج</h3><p>غيّر البحث أو الفلاتر، أو أضف طلبًا جديدًا.</p></div>}
  </>
}
