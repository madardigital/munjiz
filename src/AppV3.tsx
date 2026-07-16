import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { starterAssignments } from './data'
import { clearAssignments, loadAssignments, saveAssignments } from './storage'
import { deleteCloudAssignment, fetchCloudAssignments, saveCloudAssignment } from './cloud'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import type { Assignment } from './types'
import Account from './v3/Account'
import AddAssignment from './v3/AddAssignment'
import AssignmentsBrowser from './v3/AssignmentsBrowser'
import Auth from './v3/Auth'
import CalendarView from './v3/CalendarView'
import Details from './v3/Details'
import Home from './v3/Home'
import { errorText, type PrimaryView, type View } from './v3/shared'

export default function AppV3() {
  const cloud = isSupabaseConfigured
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(!cloud)
  const [items, setItems] = useState<Assignment[]>(() => cloud ? [] : loadAssignments(starterAssignments))
  const [view, setView] = useState<View>('home')
  const [returnView, setReturnView] = useState<PrimaryView>('home')
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
    try { setItems(await fetchCloudAssignments()) } catch (error) { setNotice(errorText(error)) } finally { setLoading(false) }
  }

  useEffect(() => { if (cloud && session) void reload(); if (cloud && !session) { setItems([]); setLoading(false) } }, [cloud, session?.user.id])
  useEffect(() => { if (!cloud) saveAssignments(items) }, [items, cloud])
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(''), 4500); return () => window.clearTimeout(timer) }, [notice])

  const persist = async (assignment: Assignment) => { if (!cloud || !session) return; try { await saveCloudAssignment(assignment, session.user) } catch (error) { setNotice(`فشلت المزامنة: ${errorText(error)}`) } }
  const update = (assignment: Assignment) => { setItems((list) => list.map((item) => item.id === assignment.id ? assignment : item)); void persist(assignment) }
  const create = (assignment: Assignment) => { setItems((list) => [assignment, ...list]); setSelected(assignment.id); setReturnView('assignments'); setView('details'); void persist(assignment) }
  const remove = async (id: string) => { setItems((list) => list.filter((item) => item.id !== id)); setView(returnView); setSelected(null); if (cloud) try { await deleteCloudAssignment(id) } catch (error) { setNotice(errorText(error)); void reload() } }
  const openDetails = (id: string, from: PrimaryView) => { setSelected(id); setReturnView(from); setView('details') }
  const openAdd = (from: PrimaryView) => { setReturnView(from); setView('add') }

  if (!ready) return <Loading />
  if (cloud && !session) return <Auth />
  const current = items.find((item) => item.id === selected)

  return <div className="app-shell">{notice && <div className="toast">{notice}</div>}<main className="page">{loading ? <Loading embedded /> : <>
    {view === 'home' && <Home items={items} cloud={cloud} onAdd={() => openAdd('home')} onOpen={(id) => openDetails(id, 'home')} onSeeAll={() => setView('assignments')} />}
    {view === 'assignments' && <AssignmentsBrowser items={items} onAdd={() => openAdd('assignments')} onOpen={(id) => openDetails(id, 'assignments')} />}
    {view === 'calendar' && <CalendarView items={items} onOpen={(id) => openDetails(id, 'calendar')} />}
    {view === 'add' && <AddAssignment onCancel={() => setView(returnView)} onCreate={create} />}
    {view === 'details' && current && <Details item={current} onBack={() => setView(returnView)} onUpdate={update} onDelete={() => void remove(current.id)} />}
    {view === 'account' && <Account cloud={cloud} email={session?.user.email} count={items.length} onSync={() => void reload()} onLogout={() => supabase?.auth.signOut()} onReset={() => { clearAssignments(); setItems(starterAssignments) }} />}
  </>}</main>
    {view !== 'add' && view !== 'details' && <nav className="bottom-nav"><button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}><span>⌂</span><small>الرئيسية</small></button><button className={view === 'assignments' ? 'active' : ''} onClick={() => setView('assignments')}><span>☷</span><small>التكليفات</small></button><button className="nav-add" onClick={() => openAdd(view as PrimaryView)}><span>＋</span><small>إضافة</small></button><button className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')}><span>▣</span><small>المواعيد</small></button><button className={view === 'account' ? 'active' : ''} onClick={() => setView('account')}><span>○</span><small>حسابي</small></button></nav>}
  </div>
}

function Loading({ embedded = false }: { embedded?: boolean }) {
  return <div className={embedded ? 'loading embedded' : 'loading'}><div className="spinner" /><p>جارٍ التحميل…</p></div>
}
