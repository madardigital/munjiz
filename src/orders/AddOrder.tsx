import { FormEvent, useMemo, useState } from 'react'
import type { NewOrder, Priority, ServiceType } from './types'
import { priorities, serviceTypes } from './types'

const toLocalInput = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const defaultTasks: Record<ServiceType, string[]> = {
  'بحث': ['مراجعة التعليمات', 'جمع المصادر', 'إعداد الخطة', 'كتابة المحتوى', 'التوثيق والتدقيق', 'التنسيق والتسليم'],
  'تقرير': ['جمع البيانات', 'إعداد الهيكل', 'كتابة التقرير', 'مراجعة النتائج', 'التنسيق والتسليم'],
  'عرض تقديمي': ['جمع المحتوى', 'إعداد مخطط الشرائح', 'تصميم الشرائح', 'المراجعة والتدرب', 'التسليم'],
  'واجب': ['فهم الأسئلة', 'حل المسودة', 'مراجعة الإجابات', 'التنسيق والتسليم'],
  'مشروع': ['تحديد النطاق', 'جمع المتطلبات', 'تنفيذ الجزء الأساسي', 'الاختبار والمراجعة', 'التسليم'],
  'تصميم': ['استلام المقاسات والمحتوى', 'إعداد التصور الأولي', 'تنفيذ التصميم', 'استلام الملاحظات', 'التعديل والتسليم'],
  'تلخيص': ['قراءة المحتوى', 'تحديد الأفكار الرئيسية', 'كتابة الملخص', 'المراجعة والتنسيق'],
  'تدقيق': ['استلام النسخة النهائية', 'التدقيق اللغوي', 'مراجعة التنسيق', 'إرسال النسخة المصححة'],
  'استبانة': ['تحديد المحاور', 'صياغة العبارات', 'مراجعة المقياس', 'التنسيق والتحكيم', 'التسليم'],
  'أخرى': ['مراجعة التفاصيل', 'تنفيذ الطلب', 'المراجعة النهائية', 'التسليم']
}

export default function AddOrder({ onCancel, onCreate }: { onCancel: () => void; onCreate: (order: NewOrder) => Promise<void> }) {
  const now = useMemo(() => new Date(), [])
  const dueDefault = useMemo(() => { const date = new Date(); date.setDate(date.getDate() + 3); date.setHours(20, 0, 0, 0); return date }, [])
  const [clientName, setClientName] = useState('')
  const [phone, setPhone] = useState('')
  const [title, setTitle] = useState('')
  const [serviceType, setServiceType] = useState<ServiceType>('بحث')
  const [courseOrEntity, setCourseOrEntity] = useState('')
  const [details, setDetails] = useState('')
  const [dueAt, setDueAt] = useState(toLocalInput(dueDefault))
  const [totalAmount, setTotalAmount] = useState('')
  const [paidAmount, setPaidAmount] = useState('0')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [priority, setPriority] = useState<Priority>('متوسطة')
  const [notes, setNotes] = useState('')
  const [taskTitles, setTaskTitles] = useState<string[]>(defaultTasks['بحث'])
  const [newTask, setNewTask] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const changeService = (value: ServiceType) => { setServiceType(value); setTaskTitles(defaultTasks[value]) }
  const addTask = () => { if (!newTask.trim()) return; setTaskTitles((tasks) => [...tasks, newTask.trim()]); setNewTask('') }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const total = Number(totalAmount)
    const paid = Number(paidAmount)
    if (paid > total) { setError('المبلغ المدفوع لا يمكن أن يكون أكبر من السعر الإجمالي.'); return }
    setBusy(true); setError('')
    try {
      await onCreate({
        clientName: clientName.trim(), phone: phone.trim(), title: title.trim(), serviceType,
        courseOrEntity: courseOrEntity.trim(), details: details.trim(), receivedAt: now.toISOString(),
        dueAt: new Date(dueAt).toISOString(), totalAmount: total, paidAmount: paid,
        paymentMethod: paymentMethod.trim(), status: paid > 0 ? 'قيد التنفيذ' : 'بانتظار العربون',
        priority, notes: notes.trim(), taskTitles, lastContactAt: undefined
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر حفظ الطلب.')
    } finally { setBusy(false) }
  }

  return <form className="om-form-page" onSubmit={submit}>
    <header className="om-form-header"><button type="button" onClick={onCancel}>→</button><div><span className="om-eyebrow">طلب عميل</span><h1>إضافة طلب</h1></div></header>
    <label>اسم العميل<input required maxLength={120} value={clientName} onChange={(event) => setClientName(event.target.value)} /></label>
    <label>رقم واتساب<input required inputMode="tel" placeholder="مثال: 9665xxxxxxxx" value={phone} onChange={(event) => setPhone(event.target.value)} /><small>اكتب رمز الدولة دون علامة + حتى يعمل زر واتساب.</small></label>
    <label>اسم الطلب<input required maxLength={180} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="مثال: بحث التسويق الرقمي" /></label>
    <div className="om-two"><label>نوع الخدمة<select value={serviceType} onChange={(event) => changeService(event.target.value as ServiceType)}>{serviceTypes.map((item) => <option key={item}>{item}</option>)}</select></label><label>الأولوية<select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>{priorities.map((item) => <option key={item}>{item}</option>)}</select></label></div>
    <label>المادة أو الجهة<input value={courseOrEntity} onChange={(event) => setCourseOrEntity(event.target.value)} placeholder="اختياري" /></label>
    <label>موعد التسليم<input required type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></label>
    <div className="om-two"><label>السعر الإجمالي (ر.س)<input required min="0" step="0.01" inputMode="decimal" type="number" value={totalAmount} onChange={(event) => setTotalAmount(event.target.value)} /></label><label>المدفوع (ر.س)<input required min="0" step="0.01" inputMode="decimal" type="number" value={paidAmount} onChange={(event) => setPaidAmount(event.target.value)} /></label></div>
    <label>طريقة الدفع<input value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} placeholder="تحويل بنكي، محفظة، نقدًا…" /></label>
    <label>تفاصيل الطلب<textarea rows={5} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="عدد الصفحات أو الشرائح، التعليمات، طريقة التوثيق…" /></label>
    <label>ملاحظات خاصة<textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
    <section className="om-task-builder"><h2>خطوات التنفيذ</h2><p>تم إنشاء خطوات مناسبة لنوع الخدمة ويمكنك تعديلها.</p><div className="om-task-drafts">{taskTitles.map((task, index) => <div key={`${task}-${index}`}><input value={task} onChange={(event) => setTaskTitles((items) => items.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} /><button type="button" onClick={() => setTaskTitles((items) => items.filter((_, itemIndex) => itemIndex !== index))}>×</button></div>)}</div><div className="om-inline"><input value={newTask} onChange={(event) => setNewTask(event.target.value)} placeholder="أضف خطوة" onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addTask() } }} /><button type="button" onClick={addTask}>＋</button></div></section>
    {error && <div className="om-alert error">{error}</div>}
    <button className="om-primary" disabled={busy}>{busy ? 'جارٍ الحفظ…' : 'حفظ الطلب'}</button><button type="button" className="om-secondary" onClick={onCancel}>إلغاء</button>
  </form>
}
