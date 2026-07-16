import type { WorkOrder, WorkTask } from './types'
import { isOpenOrder, isOverdue, money, OrderCard } from './shared'

export default function Dashboard({ orders, tasks, onAdd, onOpenOrder, onOpenOrders, onOpenTasks }: { orders: WorkOrder[]; tasks: WorkTask[]; onAdd: () => void; onOpenOrder: (id: string) => void; onOpenOrders: () => void; onOpenTasks: () => void }) {
  const open = orders.filter(isOpenOrder)
  const overdue = orders.filter(isOverdue)
  const outstanding = orders.reduce((sum, order) => sum + Math.max(0, order.totalAmount - order.paidAmount), 0)
  const today = new Date()
  const todayTasks = [...orders.flatMap((order) => order.tasks), ...tasks].filter((task) => !task.done && task.dueAt && new Date(task.dueAt).toDateString() === today.toDateString())
  const upcoming = [...open].sort((a, b) => +new Date(a.dueAt) - +new Date(b.dueAt)).slice(0, 3)
  const monthIncome = orders.flatMap((order) => order.payments).filter((payment) => {
    const date = new Date(payment.paidAt)
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()
  }).reduce((sum, payment) => sum + payment.amount, 0)

  return <>
    <header className="om-header"><div><span className="om-eyebrow">إدارة العمل</span><h1>مدار الطلبات</h1></div><div className="om-cloud">سحابي</div></header>
    <section className="om-welcome"><h2>نظرة سريعة على أعمالك</h2><p>تابع الطلبات والمواعيد والمدفوعات من مكان واحد.</p></section>
    <div className="om-dashboard-grid"><button onClick={onOpenOrders}><strong>{open.length}</strong><span>طلبات نشطة</span></button><button className={overdue.length ? 'attention' : ''} onClick={onOpenOrders}><strong>{overdue.length}</strong><span>متأخرة</span></button><button onClick={onOpenTasks}><strong>{todayTasks.length}</strong><span>مهام اليوم</span></button><div><strong>{money(outstanding)}</strong><span>مبالغ متبقية</span></div></div>
    <section className="om-income-card"><div><span>دخل هذا الشهر</span><strong>{money(monthIncome)}</strong></div><button onClick={onAdd}>＋ طلب جديد</button></section>
    <div className="om-section-head"><h2>الأقرب للتسليم</h2><button onClick={onOpenOrders}>عرض الكل</button></div>
    <div className="om-stack">{upcoming.map((order) => <OrderCard key={order.id} order={order} onClick={() => onOpenOrder(order.id)} />)}</div>
    {!upcoming.length && <div className="om-empty"><h3>لا توجد طلبات نشطة</h3><p>أضف أول طلب لبدء التنظيم.</p><button onClick={onAdd}>إضافة طلب</button></div>}
  </>
}
