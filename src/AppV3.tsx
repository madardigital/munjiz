import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { starterAssignments } from './data'
import { clearAssignments, loadAssignments, saveAssignments } from './storage'
import { deleteCloudAssignment, fetchCloudAssignments, saveCloudAssignment } from './cloud'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import type { Assignment, AssignmentType } from './types'
import Account from './v3/Account'
import AddAssignment from './v3/AddAssignment'
import AssignmentsBrowser from './v3/AssignmentsBrowser'
import Auth from './v3/Auth'
import CalendarView from './v3/CalendarView'
import Details from './v3/Details'
import Home from './v3/Home'
import ResearchAssistant from './v3/ResearchAssistant'
import TemplatesLibrary from './v3/TemplatesLibrary'
import type { AcademicTemplate } from './v3/templates'
import { errorText, uid, type PrimaryView, type View } from './v3/shared'

function dueAfter(days: number) {
  const due = new Date()
  due.setDate(due.getDate() + days)
  due.setHours(23, 59, 0, 0)
  return due.toISOString()
}

function draftType(deliverable: string): AssignmentType {
  if (deliverable.includes('عرض')) return 'عرض تقديمي'
  if (deliverable.includes('تقرير') || deliverable.includes('دراسة حالة')) return 'تقرير'
  if (deliverable.includes('خطة')) return 'مشروع'
  return 'بحث'
}

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
  const createFrom = (assignment: Assignment, from: PrimaryView) => { setItems((list) => [assignment, ...list]); setSelected(assignment.id); setReturnView(from); setView('details'); void persist(assignment) }
  const create = (assignment: Assignment) => createFrom(assignment, returnView)
  const remove = async (id: string) => { setItems((list) => list.filter((item) => item.id !== id)); setView(returnView); setSelected(null); if (cloud) try { await deleteCloudAssignment(id) } catch (error) { setNotice(errorText(error)); void reload() } }
  const openDetails = (id: string, from: PrimaryView) => { setSelected(id); setReturnView(from); setView('details') }
  const openAdd = (from: PrimaryView) => { setReturnView(from); setView('add') }

  const useTemplate = (template: AcademicTemplate) => {
    const assignment: Assignment = {
      id: uid(),
      title: template.name,
      course: template.category,
      type: template.type,
      dueAt: dueAfter(template.days),
      priority: template.priority,
      status: 'لم يبدأ',
      instructions: template.instructions,
      createdAt: new Date().toISOString(),
      tasks: template.tasks.map((title) => ({ id: uid(), title, done: false }))
    }
    createFrom(assignment, 'templates')
    setNotice('تم إنشاء التكليف من القالب. يمكنك تعديل مهامه وحالته.')
  }

  const saveResearchDraft = (draft: { topic: string; deliverable: string; content: string }) => {
    const assignment: Assignment = {
      id: uid(),
      title: draft.topic,
      course: 'مساعد البحث',
      type: draftType(draft.deliverable),
      dueAt: dueAfter(7),
      priority: 'متوسطة',
      status: 'جارٍ العمل',
      instructions: draft.content,
      createdAt: new Date().toISOString(),
      tasks: [
        { id: uid(), title: 'مراجعة صحة المعلومات والمصادر', done: false },
        { id: uid(), title: 'إضافة التحليل والصياغة الشخصية', done: false },
        { id: uid(), title: 'مطابقة تعليمات المقرر والتوثيق', done: false },
        { id: uid(), title: 'التدقيق والتنسيق النهائي', done: false }
      ]
    }
    createFrom(assignment, 'research')
    setNotice('تم حفظ المسودة كتكليف جديد.')
  }

  if (!ready) return <Loading />
  if (cloud && !session) return <Auth />
  const current = items.find((item) => item.id === selected)

  return <div className="app-shell">{notice && <div className="toast">{notice}</div>}<main className="page">{loading ? <Loading embedded /> : <>
    {view === 'home' && <Home items={items} cloud={cloud} onAdd={() => openAdd('home')} onOpen={(id) => openDetails(id, 'home')} onSeeAll={() => setView('assignments')} onResearch={() => setView('research')} onTemplates={() => setView('templates')} />}
    {view === 'assignments' && <AssignmentsBrowser items={items} onAdd={() => openAdd('assignments')} onOpen={(id) => openDetails(id, 'assignments')} />}
    {view === 'calendar' && <CalendarView items={items} onOpen={(id) => openDetails(id, 'calendar')} />}
    {view === 'research' && <ResearchAssistant onBack={() => setView('home')} onOpenTemplates={() => setView('templates')} onSaveDraft={saveResearchDraft} />}
    {view === 'templates' && <TemplatesLibrary onBack={() => setView('home')} onUse={useTemplate} />}
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
