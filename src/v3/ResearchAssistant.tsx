import { FormEvent, useState } from 'react'
import { supabase } from '../lib/supabase'
import { errorText } from './shared'

type ResearchResult = {
  content: string
  sources: { title: string; url: string }[]
  generatedAt?: string
}

type ResearchDraft = {
  topic: string
  deliverable: string
  content: string
}

async function functionErrorMessage(error: unknown): Promise<string> {
  const context = (error as { context?: Response })?.context
  if (context) {
    try {
      const payload = await context.clone().json() as { error?: string }
      if (payload.error) return payload.error
    } catch {
      // Fall back to the client error message.
    }
  }
  return errorText(error)
}

export default function ResearchAssistant({ onBack, onOpenTemplates, onSaveDraft }: { onBack: () => void; onOpenTemplates: () => void; onSaveDraft: (draft: ResearchDraft) => void }) {
  const [topic, setTopic] = useState('')
  const [deliverable, setDeliverable] = useState('بحث أكاديمي')
  const [academicLevel, setAcademicLevel] = useState('جامعي')
  const [language, setLanguage] = useState<'العربية' | 'English'>('العربية')
  const [citationStyle, setCitationStyle] = useState('APA 7')
  const [wordCount, setWordCount] = useState(1200)
  const [notes, setNotes] = useState('')
  const [result, setResult] = useState<ResearchResult | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const generate = async (event: FormEvent) => {
    event.preventDefault()
    if (!supabase) {
      setMessage('الاتصال السحابي غير مهيأ.')
      return
    }
    setBusy(true)
    setMessage('')
    setResult(null)
    try {
      const { data, error } = await supabase.functions.invoke('research-assistant', {
        body: { topic, deliverable, academicLevel, language, citationStyle, wordCount, notes }
      })
      if (error) throw error
      if (!data?.content) throw new Error(data?.error || 'لم يصل محتوى صالح.')
      setResult(data as ResearchResult)
    } catch (error) {
      setMessage(await functionErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  const copyResult = async () => {
    if (!result) return
    const references = result.sources.length
      ? `\n\nالمصادر:\n${result.sources.map((source, index) => `${index + 1}. ${source.title} — ${source.url}`).join('\n')}`
      : ''
    await navigator.clipboard.writeText(`${result.content}${references}`)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return <>
    <header className="form-header"><button className="back-button" onClick={onBack}>→</button><div><span className="eyebrow">بحث وكتابة موثقة</span><h1>مساعد البحث</h1></div></header>
    <section className="ai-intro"><div className="ai-mark">AI</div><div><h2>ابحث في الإنترنت واكتب مسودة</h2><p>يجمع مصادر حديثة، ينظم الأفكار، ويكتب محتوى مع إحالات ومراجع قابلة للمراجعة.</p></div></section>
    <button className="templates-shortcut" onClick={onOpenTemplates}><span>▦</span><div><strong>ابدأ من قالب جاهز</strong><small>بحث، تقرير، عرض، دراسة حالة، خطة بحث وغيرها</small></div><span>‹</span></button>

    <form className="research-form" onSubmit={generate}>
      <label>موضوع البحث أو السؤال<textarea required minLength={5} maxLength={500} rows={3} value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="مثال: أثر التحول الرقمي في تحسين الاتصال المؤسسي" /></label>
      <div className="two-columns"><label>نوع المحتوى<select value={deliverable} onChange={(event) => setDeliverable(event.target.value)}><option>بحث أكاديمي</option><option>تقرير</option><option>مراجعة أدبيات</option><option>دراسة حالة</option><option>مقال تحليلي</option><option>خطة بحث</option><option>محتوى عرض تقديمي</option></select></label><label>المستوى<select value={academicLevel} onChange={(event) => setAcademicLevel(event.target.value)}><option>ثانوي</option><option>دبلوم</option><option>جامعي</option><option>دراسات عليا</option></select></label></div>
      <div className="two-columns"><label>اللغة<select value={language} onChange={(event) => setLanguage(event.target.value as 'العربية' | 'English')}><option>العربية</option><option>English</option></select></label><label>التوثيق<select value={citationStyle} onChange={(event) => setCitationStyle(event.target.value)}><option>APA 7</option><option>Harvard</option><option>MLA 9</option><option>Chicago</option><option>Vancouver</option></select></label></div>
      <label>الطول التقريبي<select value={wordCount} onChange={(event) => setWordCount(Number(event.target.value))}><option value={600}>600 كلمة</option><option value={1200}>1200 كلمة</option><option value={1800}>1800 كلمة</option><option value={2500}>2500 كلمة</option></select></label>
      <label>تعليمات إضافية (اختياري)<textarea rows={3} maxLength={1200} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="عدد المحاور، دولة أو فترة زمنية، مصادر رسمية فقط…" /></label>
      {message && <div className="form-alert error">{message}</div>}
      <button className="ai-generate-button" disabled={busy}>{busy ? 'جارٍ البحث وجمع المصادر…' : 'بحث وكتابة المسودة'}</button>
      <p className="ai-disclaimer">راجع الحقائق والمراجع قبل التسليم، وأضف تحليلك وصياغتك بما يتوافق مع تعليمات المقرر.</p>
    </form>

    {busy && <section className="ai-progress"><div className="spinner" /><div><strong>يبحث في الويب</strong><p>قد يستغرق ذلك دقيقة بحسب الموضوع وعدد المصادر.</p></div></section>}

    {result && <section className="research-result">
      <div className="section-head compact"><div><span className="eyebrow">مسودة مولدة</span><h2>{topic}</h2></div><span className="source-count">{result.sources.length} مصدر</span></div>
      <div className="result-actions"><button onClick={() => void copyResult()}>{copied ? 'تم النسخ' : 'نسخ المحتوى'}</button><button onClick={() => onSaveDraft({ topic, deliverable, content: result.content })}>حفظ كتكليف</button></div>
      <article className="generated-content">{result.content}</article>
      <div className="sources-section"><h3>المصادر المستخدمة</h3>{result.sources.length ? <ol>{result.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a><small>{source.url}</small></li>)}</ol> : <p>لم تُعد قائمة مصادر منفصلة؛ راجع الإحالات داخل النص.</p>}</div>
    </section>}
  </>
}
