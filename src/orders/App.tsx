import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import AddOrder from './AddOrder'
import OrdersAccount from './Account'
import OrdersAuth from './Auth'
import Dashboard from './Dashboard'
import OrderDetails from './OrderDetails'
import OrdersList from './OrdersList'
import TasksView from './TasksView'
import { addPayment, createOrder, createTask, deleteOrder, deleteTask, fetchWorkspace, markContacted, updateOrder, updateTask } from './cloud'
import { errorText, Loading, type View } from './shared'
import type { NewOrder, Priority, WorkOrder, WorkTask } from './types'

export default function OrdersApp() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [standaloneTasks, setStandaloneTasks] = useState<WorkTask[]>([])
  const [view, setView] = useState<View>('home')
  const [returnView, setReturnView] = useState<View>('home')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!supabase) { setReady(true); return }
    void supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true) })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); setReady(true) })
    return () => data.subscription.unsubscribe()
  }, [])

  const reload = async () => {
    if (!session) return
    setLoading(true)
    try {
      const workspace = await fetchWorkspace()
      setOrders(workspace.orders)
      setStandaloneTasks(workspace.standaloneTasks)
    } catch (error) {
      setNotice(errorText(error))
    } finally { setLoading(false) }
  }

  useEffect(() => { if (session) void reload(); else { setOrders([]); setStandaloneTasks([]) } }, [session?.user.id])
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(''), 4200); return () => window.clearTimeout(timer) }, [notice])

  const openOrder = (id: string, from: View) => { setSelectedId(id); setReturnView(from); setView('details') }
  const openAdd = (from: View) => { setReturnView(from); setView('add') }
  const current = orders.find((order) => order.id === selectedId)

  const handleCreate = async (input: NewOrder) => {
    if (!session) throw new Error('سجّل الدخول أولًا.')
    const id = await createOrder(input, session.user)
    await reload()
    setSelectedId(id)
    setReturnView('orders')
    setView('details')
    setNotice('تم تسجيل الطلب بنجاح.')
  }

  const handleUpdate = async (order: WorkOrder) => {
    setOrders((items) => items.map((item) => item.id === order.id ? order : item))
    try { await updateOrder(order); await reload() } catch (error) { setNotice(errorText(error)); await reload() }
  }

  const handleDeleteOrder = async () => {
    if (!current) return
    try { await deleteOrder(current.id); setView(returnView); setSelectedId(null); await reload(); setNotice('تم حذف الطلب.') } catch (error) { setNotice(errorText(error)) }
  }

  const handleToggleTask = async (task: WorkTask) => {
    try { await updateTask(task); await reload() } catch (error) { setNotice(errorText(error)) }
  }

  const handleCreateTask = async (input: { orderId?: string; title: string; dueAt?: string; priority: Priority; notes?: string }) => {
    if (!session) return
    try { await createTask(input, session.user); await reload(); setNotice('تمت إضافة المهمة.') } catch (error) { setNotice(errorText(error)); throw error }
  }

  const handleDeleteTask = async (id: string) => {
    try { await deleteTask(id); await reload() } catch (error) { setNotice(errorText(error)) }
  }

  const handleAddPayment = async (amount: number, method: string, note: string) => {
    if (!session || !current) return
    try { await addPayment({ order: current, amount, method, note }, session.user); await reload() } catch (error) { setNotice(errorText(error)); throw error }
  }

  const handleContact = async () => {
    if (!current) return
    try { await markContacted(current.id); await reload() } catch (error) { setNotice(errorText(error)) }
  }

  if (!ready) return <Loading />
  if (!session) return <OrdersAuth />

  return <div className="om-shell">{notice && <div className="om-toast">{notice}</div>}<main className="om-page">{loading && view !== 'details' ? <Loading /> : <>
    {view === 'home' && <Dashboard orders={orders} tasks={standaloneTasks} onAdd={() => openAdd('home')} onOpenOrder={(id) => openOrder(id, 'home')} onOpenOrders={() => setView('orders')} onOpenTasks={() => setView('tasks')} />}
    {view === 'orders' && <OrdersList orders={orders} onAdd={() => openAdd('orders')} onOpen={(id) => openOrder(id, 'orders')} />}
    {view === 'add' && <AddOrder onCancel={() => setView(returnView)} onCreate={handleCreate} />}
    {view === 'details' && current && <OrderDetails order={current} onBack={() => setView(returnView)} onUpdate={handleUpdate} onDelete={handleDeleteOrder} onToggleTask={handleToggleTask} onAddTask={(title) => handleCreateTask({ orderId: current.id, title, dueAt: current.dueAt, priority: current.priority })} onDeleteTask={handleDeleteTask} onAddPayment={handleAddPayment} onContact={handleContact} />}
    {view === 'tasks' && <TasksView orders={orders} standaloneTasks={standaloneTasks} onToggle={handleToggleTask} onAdd={handleCreateTask} onDelete={handleDeleteTask} />}
    {view === 'account' && <OrdersAccount email={session.user.email} orders={orders} onSync={reload} onLogout={() => supabase?.auth.signOut()} />}
  </>}</main>
    {view !== 'add' && view !== 'details' && <nav className="om-bottom-nav"><button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}><span>⌂</span><small>الرئيسية</small></button><button className={view === 'orders' ? 'active' : ''} onClick={() => setView('orders')}><span>☷</span><small>الطلبات</small></button><button className="add" onClick={() => openAdd(view)}><span>＋</span><small>إضافة</small></button><button className={view === 'tasks' ? 'active' : ''} onClick={() => setView('tasks')}><span>✓</span><small>مهامي</small></button><button className={view === 'account' ? 'active' : ''} onClick={() => setView('account')}><span>○</span><small>حسابي</small></button></nav>}
  </div>
}
