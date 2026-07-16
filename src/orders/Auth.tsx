import { FormEvent, useState } from 'react'
import { supabase } from '../lib/supabase'
import { errorText } from './shared'

export default function OrdersAuth() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!supabase) return
    setBusy(true)
    setMessage('')
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: name.trim() } } })
        if (error) throw error
        setMessage('تم إنشاء الحساب. تحقق من بريدك لتأكيد التسجيل.')
      }
    } catch (error) {
      setMessage(errorText(error))
    } finally {
      setBusy(false)
    }
  }

  return <div className="om-auth-page"><section className="om-auth-card">
    <div className="om-brand-mark">م</div><h1>مدار الطلبات</h1><p>أدر طلبات العملاء ومهامك ومدفوعاتك من الهاتف.</p>
    <div className="om-auth-tabs"><button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>دخول</button><button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>حساب جديد</button></div>
    <form onSubmit={submit}>{mode === 'signup' && <label>الاسم<input required value={name} onChange={(event) => setName(event.target.value)} /></label>}
      <label>البريد الإلكتروني<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label>كلمة المرور<input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      {message && <div className="om-alert">{message}</div>}
      <button className="om-primary" disabled={busy}>{busy ? 'جارٍ التنفيذ…' : mode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب'}</button>
    </form>
  </section></div>
}
