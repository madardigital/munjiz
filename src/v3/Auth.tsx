import { FormEvent, useState } from 'react'
import { supabase } from '../lib/supabase'
import { errorText } from './shared'

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
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
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name.trim() } }
        })
        if (error) throw error
        setMessage('تم إنشاء الحساب. تحقق من بريدك لتأكيد التسجيل.')
      }
    } catch (error) {
      setMessage(errorText(error))
    } finally {
      setBusy(false)
    }
  }

  const resetPassword = async () => {
    if (!supabase || !email.trim()) {
      setMessage('اكتب بريدك الإلكتروني أولًا.')
      return
    }
    setBusy(true)
    try {
      const redirectTo = new URL(import.meta.env.BASE_URL, window.location.origin).toString()
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
      if (error) throw error
      setMessage('تم إرسال رابط استعادة كلمة المرور إلى بريدك.')
    } catch (error) {
      setMessage(errorText(error))
    } finally {
      setBusy(false)
    }
  }

  return <div className="auth-page"><section className="auth-card">
    <div className="brand-mark">م</div><h1>منجِز</h1><p>نظّم تكليفاتك ومواعيدك من الهاتف.</p>
    <div className="auth-tabs"><button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>دخول</button><button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>حساب جديد</button></div>
    <form onSubmit={submit}>
      {mode === 'signup' && <label>الاسم<input required value={name} onChange={(event) => setName(event.target.value)} /></label>}
      <label>البريد الإلكتروني<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label>كلمة المرور<input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      {message && <div className="form-alert">{message}</div>}
      <button className="primary-button auth-submit" disabled={busy}>{busy ? 'جارٍ التنفيذ…' : mode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب'}</button>
    </form>
    {mode === 'login' && <button className="text-button" onClick={() => void resetPassword()}>نسيت كلمة المرور؟</button>}
  </section></div>
}
