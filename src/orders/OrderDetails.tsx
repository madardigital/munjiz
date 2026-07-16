import { FormEvent, useEffect, useState } from 'react'
import type { OrderStatus, Priority, WorkOrder, WorkTask } from './types'
import { orderStatuses, priorities } from './types'
import { dateText, money, normalizePhone, progress, remaining, whatsappTemplates } from './shared'

export default function OrderDetails({ order, onBack, onUpdate, onDelete, onToggleTask, onAddTask, onDeleteTask, onAddPayment, onContact }: {
  order: WorkOrder
  onBack: () => void
  onUpdate: (order: WorkOrder) => Promise<void>
  onDelete: () => Promise<void>
  onToggleTask: (task: WorkTask) => Promise<void>
  onAddTask: (title: string) => Promise<void>
  onDeleteTask: (id: string) => Promise<void>
  onAddPayment: (amount: number, method: string, note: string) => Promise<void>
  onContact: () => Promise<void>
}) {
  const [templateId, setTemplateId] = useState('received')
  const [whatsappMessage, setWhatsappMessage] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState(order.paymentMethod)
  const [paymentNote, setPaymentNote] = useState('')
  const [showPayment, setShowPayment] = useState(false)
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const template = whatsappTemplates.find((item) => item.id === templateId) ?? whatsappTemplates[0]
    setWhatsappMessage(template.build(order))
  }, [templateId, order])

  const openWhatsApp = async () => {
    const phone = normalizePhone(order.phone)
    if (phone.length < 8) { setNotice('رقم واتساب غير صحيح. أضف رمز الدولة والرقم كاملًا.'); return }
    await onContact()
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(whatsappMessage)}`, '_blank', 'noopener,noreferrer')
  }

  const copyMessage = async () => {
    await navigator.clipboard.writeText(whatsappMessage)
    setNotice('تم نسخ الرسالة.')
  }

  const changeStatus = async (status: OrderStatus) => {
    const next = { ...order, status, paidAmount: status === 'مكتمل ومدفوع' ? order.totalAmount : order.paidAmount }
    await onUpdate(next)
  }

  const addTask = async (event: FormEvent) => {
    event.preventDefault(); if (!taskTitle.trim()) return; setBusy(true)
    try { await onAddTask(taskTitle.trim()); setTaskTitle('') } finally { setBusy(false) }
  }

  const addPayment = async (event: FormEvent) => {
    event.preventDefault()
    const amount = Number(paymentAmount)
    if (amount <= 0) { setNotice('اكتب مبلغًا صحيحًا.'); return }
    if (amount > remaining(order)) { setNotice('المبلغ أكبر من المتبقي على الطلب.'); return }
    setBusy(true)
    try { await onAddPayment(amount, paymentMethod.trim(), paymentNote.trim()); setPaymentAmount(''); setPaymentNote(''); setShowPayment(false); setNotice('تم تسجيل الدفعة.') } finally { setBusy(false) }
  }

  return <>
    <header className="om-form-header"><button onClick={onBack}>→</button><div><span className="om-eyebrow">{order.clientName}</span><h1>{order.title}</h1></div></header>
    {notice && <div className="om-alert">{notice}</div>}
    <section className="om-order-hero"><div className="om-card-top"><div><span>{order.serviceType}</span><h2>{order.courseOrEntity || 'بدون مادة أو جهة'}</h2></div><strong>{progress(order)}%</strong></div><div className="om-progress light"><span style={{ width: `${progress(order)}%` }} /></div><p>موعد التسليم: {dateText(order.dueAt)}</p></section>

    <section className="om-finance"><div><span>الإجمالي</span><strong>{money(order.totalAmount)}</strong></div><div><span>المدفوع</span><strong>{money(order.paidAmount)}</strong></div><div className={remaining(order) ? 'remaining' : 'paid'}><span>المتبقي</span><strong>{money(remaining(order))}</strong></div></section>
    <button className="om-payment-button" onClick={() => setShowPayment((value) => !value)}>＋ تسجيل دفعة جديدة</button>
    {showPayment && <form className="om-quick-form" onSubmit={addPayment}><div className="om-two"><label>المبلغ<input required min="0.01" max={remaining(order)} step="0.01" type="number" inputMode="decimal" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} /></label><label>الطريقة<input value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} /></label></div><label>ملاحظة<input value={paymentNote} onChange={(event) => setPaymentNote(event.target.value)} /></label><button className="om-primary" disabled={busy}>حفظ الدفعة</button></form>}

    <section className="om-panel"><h2>حالة الطلب</h2><div className="om-two"><label>الحالة<select value={order.status} onChange={(event) => void changeStatus(event.target.value as OrderStatus)}>{orderStatuses.map((item) => <option key={item}>{item}</option>)}</select></label><label>الأولوية<select value={order.priority} onChange={(event) => void onUpdate({ ...order, priority: event.target.value as Priority })}>{priorities.map((item) => <option key={item}>{item}</option>)}</select></label></div></section>

    <section className="om-panel om-whatsapp-panel"><div className="om-section-head"><div><span className="om-eyebrow">تواصل سريع</span><h2>واتساب العميل</h2></div><span className="om-phone">{order.phone}</span></div><label>قالب الرسالة<select value={templateId} onChange={(event) => setTemplateId(event.target.value)}>{whatsappTemplates.map((template) => <option key={template.id} value={template.id}>{template.label}</option>)}</select></label><textarea rows={7} value={whatsappMessage} onChange={(event) => setWhatsappMessage(event.target.value)} /><div className="om-action-grid"><button className="whatsapp" onClick={() => void openWhatsApp()}>فتح واتساب</button><button onClick={() => void copyMessage()}>نسخ الرسالة</button></div><small>آخر تواصل: {dateText(order.lastContactAt)}</small></section>

    <section className="om-panel"><div className="om-section-head"><h2>مهام الطلب</h2><span>{order.tasks.filter((task) => task.done).length}/{order.tasks.length}</span></div><div className="om-task-list compact">{order.tasks.map((task) => <article className={task.done ? 'om-task-item done' : 'om-task-item'} key={task.id}><label><input type="checkbox" checked={task.done} onChange={() => void onToggleTask({ ...task, done: !task.done })} /><div><strong>{task.title}</strong><small>{task.priority}</small></div></label><button className="om-delete-mini" onClick={() => window.confirm('حذف المهمة؟') && void onDeleteTask(task.id)}>×</button></article>)}</div><form className="om-inline" onSubmit={addTask}><input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="أضف مهمة للطلب" /><button disabled={busy}>＋</button></form></section>

    <section className="om-panel"><h2>تفاصيل الطلب</h2><dl className="om-details-list"><div><dt>العميل</dt><dd>{order.clientName}</dd></div><div><dt>نوع الخدمة</dt><dd>{order.serviceType}</dd></div><div><dt>تاريخ الاستلام</dt><dd>{dateText(order.receivedAt)}</dd></div><div><dt>طريقة الدفع</dt><dd>{order.paymentMethod || 'غير محددة'}</dd></div></dl>{order.details && <><h3>التعليمات</h3><p className="om-pre">{order.details}</p></>}{order.notes && <><h3>ملاحظاتي</h3><p className="om-pre">{order.notes}</p></>}</section>

    {order.payments.length > 0 && <section className="om-panel"><h2>سجل الدفعات</h2><div className="om-payments">{order.payments.map((payment) => <div key={payment.id}><div><strong>{money(payment.amount)}</strong><span>{payment.method || 'غير محدد'}</span></div><small>{dateText(payment.paidAt)}{payment.note ? ` · ${payment.note}` : ''}</small></div>)}</div></section>}
    <button className="om-secondary danger" onClick={() => window.confirm('حذف الطلب نهائيًا؟') && void onDelete()}>حذف الطلب</button>
  </>
}
