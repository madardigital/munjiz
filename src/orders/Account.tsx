import type { WorkOrder } from './types'
import { money } from './shared'

export default function OrdersAccount({ email, orders, onSync, onLogout }: { email?: string; orders: WorkOrder[]; onSync: () => Promise<void>; onLogout: () => Promise<unknown> | unknown }) {
  const total = orders.reduce((sum, order) => sum + order.totalAmount, 0)
  const paid = orders.reduce((sum, order) => sum + order.paidAmount, 0)
  return <>
    <header className="om-header"><div><span className="om-eyebrow">الإعدادات</span><h1>حسابي</h1></div></header>
    <section className="om-profile"><div>م</div><section><h2>{email?.split('@')[0] || 'المستخدم'}</h2><p>{email}</p></section></section>
    <section className="om-panel om-settings"><div><span>إجمالي الطلبات</span><strong>{orders.length}</strong></div><div><span>قيمة الأعمال المسجلة</span><strong>{money(total)}</strong></div><div><span>المبالغ المستلمة</span><strong>{money(paid)}</strong></div><div><span>التخزين</span><strong>Supabase سحابي</strong></div><div><span>الإصدار</span><strong>1.0.0</strong></div></section>
    <button className="om-secondary" onClick={() => void onSync()}>مزامنة البيانات الآن</button>
    <button className="om-secondary danger" onClick={() => void onLogout()}>تسجيل الخروج</button>
  </>
}
