import { FormEvent, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { starterAssignments } from './data'
import { clearAssignments, loadAssignments, saveAssignments } from './storage'
import { deleteCloudAssignment, fetchCloudAssignments, saveCloudAssignment } from './cloud'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import type { Assignment, AssignmentStatus, AssignmentType, Priority } from './types'

type View = 'home' | 'add' | 'details' | 'account'
const types: AssignmentType[] = ['بحث', 'تقرير', 'عرض تقديمي', 'واجب', 'مشروع', 'اختبار', 'أخرى']
const priorities: Priority[] = ['منخفضة', 'متوسطة', 'عالية', 'عاجلة']
const statuses: AssignmentStatus[] = ['لم يبدأ', 'جارٍ العمل', 'يحتاج معلومات', 'جاهز للمراجعة', 'مكتمل']

const uid = () => crypto.randomUUID()
const pct = (a: Assignment) => a.tasks.length ? Math.round(a.tasks.filter(t => t.done).length / a.tasks.length * 100) : a.status === 'مكتمل' ? 100 : 0
const dateText = (iso: string) => new Intl.DateTimeFormat('ar-SA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
const errorText = (e: unknown) => e instanceof Error ? e.message : 'حدث خطأ غير متوقع.'

export default function App() {
  const cloud = isSupabaseConfigured
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(!cloud)
  const [items, setItems] = useState<Assignment[]>(() => cloud ? [] : loadAssignments(starterAssignments))
  const [view, setView] = useState<View>('home')
  const [selected, setSelected] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(cloud)

  useEffect(() => {
    if (!cloud || !supabase) return
    void supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true) })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); setReady(true) })
    return () => data.subscription.unsubscribe()
  }, [cloud])

  const reload = async () => {
    if (!session) return
    setLoading(true)
    try { setItems(await fetchCloudAssignments()) }
    catch (e) { setNotice(errorText(e)) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (cloud && session) void reload()
    if (cloud && !session) { setItems([]); setLoading(false) }
  }, [cloud, session?.user.id])

  useEffect(() => { if (!cloud) saveAssignments(items) }, [items, cloud])
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 4500)
    return () => window.clearTimeout(timer)
  }, [notice])

  const persist = async (a: Assignment) => {
    if (!cloud || !session) return
    try { await saveCloudAssignment(a, session.user) }
    catch (e) { setNotice(`فشلت المزامنة: ${errorText(e)}`) }
  }

  const update = (a: Assignment) => { setItems(list => list.map(x => x.id === a.id ? a : x)); void persist(a) }
  const create = (a: Assignment) => { setItems(list => [a, ...list]); setSelected(a.id); setView('details'); void persist(a) }
  const remove = async (id: string) => {
    setItems(list => list.filter(x => x.id !== id)); setView('home'); setSelected(null)
    if (cloud) try { await deleteCloudAssignment(id) } catch (e) { setNotice(errorText(e)); void reload() }
  }

  if (!ready) return <Loading />
  if (cloud && !session) return <Auth />
  const current = items.find(x => x.id === selected)

  return <div className="app-shell">
    {notice && <div className="toast">{notice}</div>}
    <main className="page">
      {loading ? <Loading embedded /> : <>
        {view === 'home' && <Home items={items} cloud={cloud} onAdd={() => setView('add')} onOpen={id => { setSelected(id); setView('details') }} />}
        {view === 'add' && <Add onCancel={() => setView('home')} onCreate={create} />}
        {view === 'details' && current && <Details item={current} onBack={() => setView('home')} onUpdate={update} onDelete={() => void remove(current.id)} />}
        {view === 'account' && <Account cloud={cloud} email={session?.user.email} count={items.length} onSync={() => void reload()} onLogout={() => supabase?.auth.signOut()} onReset={() => { clearAssignments(); setItems(starterAssignments) }} />}
      </>}
    </main>
    {view !== 'add' && view !== 'details' && <nav className="bottom-nav">
      <button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}><span>⌂</span><small>الرئيسية</small></button>
      <button onClick={() => setView('home')}><span>☷</span><small>التكليفات</small></button>
      <button className="nav-add" onClick={() => setView('add')}><span>＋</span><small>إضافة</small></button>
      <button onClick={() => setView('home')}><span>▣</span><small>المواعيد</small></button>
      <button className={view === 'account' ? 'active' : ''} onClick={() => setView('account')}><span>○</span><small>حسابي</small></button>
    </nav>}
  </div>
}

function Loading({ embedded = false }: { embedded?: boolean }) {
  return <div className={embedded ? 'loading embedded' : 'loading'}><div className="spinner" /><p>جارٍ التحميل…</p></div>
}

function Auth() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (!supabase) return; setBusy(true); setMessage('')
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: name.trim() } } }); if (error) throw error
        setMessage('تم إنشاء الحساب. تحقق من بريدك لتأكيد التسجيل.')
      }
    } catch (err) { setMessage(errorText(err)) } finally { setBusy(false) }
  }
  return <div className="auth-page"><section className="auth-card">
    <div className="brand-mark">م</div><h1>منجِز</h1><p>نظّم تكليفاتك ومواعيدك من الهاتف.</p>
    <div className="auth-tabs"><button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>دخول</button><button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>حساب جديد</button></div>
    <form onSubmit={submit}>{mode === 'signup' && <label>الاسم<input required value={name} onChange={e => setName(e.target.value)} /></label>}
      <label>البريد الإلكتروني<input required type="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
      <label>كلمة المرور<input required minLength={6} type="password" value={password} onChange={e => setPassword(e.target.value)} /></label>
      {message && <div className="form-alert">{message}</div>}<button className="primary-button auth-submit" disabled={busy}>{busy ? 'جارٍ التنفيذ…' : mode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب'}</button>
    </form>
  </section></div>
}

function Home({ items, cloud, onAdd, onOpen }: { items: Assignment[]; cloud: boolean; onAdd: () => void; onOpen: (id: string) => void }) {
  const active = items.filter(x => x.status !== 'مكتمل').sort((a, b) => +new Date(a.dueAt) - +new Date(b.dueAt))
  const done = items.filter(x => x.status === 'مكتمل').length
  return <>
    <header className="topbar"><div><span className="eyebrow">تطبيق الطلاب</span><h1>منجِز</h1></div><span className="sync-badge">{cloud ? 'سحابي' : 'محلي'}</span></header>
    <section className="welcome"><h2>رتّب تكليفاتك</h2><p>تابع المواعيد والمهام من مكان واحد.</p></section>
    {active[0] && <section className="hero-card"><span className="muted">أقرب موعد</span><h3>{active[0].title}</h3><p>{active[0].course} — {dateText(active[0].dueAt)}</p><div className="progress-track"><span style={{ width: `${pct(active[0])}%` }} /></div><button className="primary-button" onClick={() => onOpen(active[0].id)}>متابعة التكليف</button></section>}
    <div className="stats-grid"><div className="stat"><strong>{active.length}</strong><span>قيد المتابعة</span></div><div className="stat"><strong>{done}</strong><span>مكتملة</span></div></div>
    <button className="wide-add" onClick={onAdd}>＋ إضافة تكليف جديد</button>
    <div className="section-head"><h2>التكليفات</h2></div><div className="assignment-stack">{items.map(a => <Card key={a.id} item={a} onClick={() => onOpen(a.id)} />)}</div>
    {!items.length && <div className="empty-state"><h3>لا توجد تكليفات</h3><p>ابدأ بإضافة أول تكليف.</p></div>}
  </>
}

function Card({ item, onClick }: { item: Assignment; onClick: () => void }) {
  return <button className="assignment-card" onClick={onClick}><div className="card-row"><div><h3>{item.title}</h3><p>{item.course}</p></div><span className={`priority priority-${item.priority}`}>{item.priority}</span></div><div className="progress-track small"><span style={{ width: `${pct(item)}%` }} /></div><div className="card-row"><span>{dateText(item.dueAt)}</span><strong>{pct(item)}%</strong></div></button>
}

function Add({ onCancel, onCreate }: { onCancel: () => void; onCreate: (a: Assignment) => void }) {
  const [title, setTitle] = useState(''), [course, setCourse] = useState(''), [dueAt, setDueAt] = useState('')
  const [type, setType] = useState<AssignmentType>('بحث'), [priority, setPriority] = useState<Priority>('متوسطة'), [instructions, setInstructions] = useState('')
  const submit = (e: FormEvent) => { e.preventDefault(); onCreate({ id: uid(), title: title.trim(), course: course.trim(), type, priority, dueAt: new Date(dueAt).toISOString(), status: 'لم يبدأ', instructions: instructions.trim(), createdAt: new Date().toISOString(), tasks: [{ id: uid(), title: 'مراجعة التعليمات', done: false }, { id: uid(), title: 'تنفيذ المحتوى', done: false }, { id: uid(), title: 'المراجعة والتسليم', done: false }] }) }
  return <form className="form-page" onSubmit={submit}><header className="form-header"><button type="button" className="back-button" onClick={onCancel}>→</button><h1>تكليف جديد</h1></header>
    <label>اسم التكليف<input required maxLength={160} value={title} onChange={e => setTitle(e.target.value)} /></label><label>اسم المادة<input required maxLength={120} value={course} onChange={e => setCourse(e.target.value)} /></label>
    <div className="two-columns"><label>النوع<select value={type} onChange={e => setType(e.target.value as AssignmentType)}>{types.map(x => <option key={x}>{x}</option>)}</select></label><label>الأولوية<select value={priority} onChange={e => setPriority(e.target.value as Priority)}>{priorities.map(x => <option key={x}>{x}</option>)}</select></label></div>
    <label>موعد التسليم<input required type="datetime-local" value={dueAt} onChange={e => setDueAt(e.target.value)} /></label><label>التعليمات<textarea rows={5} value={instructions} onChange={e => setInstructions(e.target.value)} /></label><button className="primary-button">حفظ التكليف</button><button type="button" className="secondary-button" onClick={onCancel}>إلغاء</button>
  </form>
}

function Details({ item, onBack, onUpdate, onDelete }: { item: Assignment; onBack: () => void; onUpdate: (a: Assignment) => void; onDelete: () => void }) {
  const [task, setTask] = useState('')
  const add = (e: FormEvent) => { e.preventDefault(); if (!task.trim()) return; onUpdate({ ...item, tasks: [...item.tasks, { id: uid(), title: task.trim(), done: false }] }); setTask('') }
  return <><header className="details-header"><button className="back-button" onClick={onBack}>→</button><div><span className="eyebrow">{item.course}</span><h1>{item.title}</h1></div></header>
    <section className="details-summary"><div className="progress-number">{pct(item)}%</div><div className="progress-track"><span style={{ width: `${pct(item)}%` }} /></div><p>{dateText(item.dueAt)}</p></section>
    <section className="panel"><h2>المهام</h2><div className="task-list">{item.tasks.map(t => <div className={t.done ? 'task done' : 'task'} key={t.id}><label><input type="checkbox" checked={t.done} onChange={() => onUpdate({ ...item, tasks: item.tasks.map(x => x.id === t.id ? { ...x, done: !x.done } : x) })} /><span>{t.title}</span></label><button className="task-delete" onClick={() => onUpdate({ ...item, tasks: item.tasks.filter(x => x.id !== t.id) })}>×</button></div>)}</div><form className="inline-form" onSubmit={add}><input value={task} onChange={e => setTask(e.target.value)} placeholder="أضف مهمة" /><button>＋</button></form></section>
    <section className="panel"><h2>التعليمات</h2><p className="instructions">{item.instructions || 'لم تُضف تعليمات.'}</p></section><label className="status-control">الحالة<select value={item.status} onChange={e => onUpdate({ ...item, status: e.target.value as AssignmentStatus })}>{statuses.map(x => <option key={x}>{x}</option>)}</select></label><button className="secondary-button danger" onClick={() => window.confirm('حذف التكليف؟') && onDelete()}>حذف التكليف</button>
  </>
}

function Account({ cloud, email, count, onSync, onLogout, onReset }: { cloud: boolean; email?: string; count: number; onSync: () => void; onLogout: () => unknown; onReset: () => void }) {
  return <><header className="simple-header"><h1>حسابي</h1></header><section className="profile-card"><div className="avatar">م</div><div><h2>{email?.split('@')[0] || 'الطالب'}</h2><p>{email || 'نسخة محلية'}</p></div></section><section className="panel settings-list"><div><span>إجمالي التكليفات</span><strong>{count}</strong></div><div><span>التخزين</span><strong>{cloud ? 'Supabase' : 'هذا الجهاز'}</strong></div></section>{cloud ? <><button className="secondary-button" onClick={onSync}>مزامنة الآن</button><button className="secondary-button danger" onClick={() => void onLogout()}>تسجيل الخروج</button></> : <button className="secondary-button danger" onClick={onReset}>استعادة البيانات التجريبية</button>}</>
}
