import { useMemo, useState } from 'react'
import { SearchBox } from './shared'
import { academicTemplates, type AcademicTemplate } from './templates'

export default function TemplatesLibrary({ onBack, onUse }: { onBack: () => void; onUse: (template: AcademicTemplate) => void }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('الكل')
  const categories = ['الكل', ...Array.from(new Set(academicTemplates.map((template) => template.category)))]
  const filtered = useMemo(() => academicTemplates.filter((template) => {
    const text = `${template.name} ${template.description} ${template.category} ${template.instructions} ${template.tasks.join(' ')}`.toLowerCase()
    return (category === 'الكل' || template.category === category) && text.includes(query.trim().toLowerCase())
  }), [query, category])

  return <>
    <header className="form-header"><button className="back-button" onClick={onBack}>→</button><div><span className="eyebrow">بداية سريعة</span><h1>قوالب جاهزة</h1></div></header>
    <p>اختر قالبًا ليُنشئ التطبيق تكليفًا منظمًا مع خطة ومهام قابلة للتعديل.</p>
    <SearchBox value={query} onChange={setQuery} placeholder="ابحث عن قالب بحث أو تقرير أو عرض…" />
    <div className="filter-scroll">{categories.map((item) => <button key={item} className={category === item ? 'filter active' : 'filter'} onClick={() => setCategory(item)}>{item}</button>)}</div>
    <div className="template-grid">{filtered.map((template) => <article className="template-card" key={template.id}>
      <div className="template-heading"><div><span className="template-category">{template.category}</span><h2>{template.name}</h2></div><span className="template-days">{template.days} أيام</span></div>
      <p>{template.description}</p>
      <div className="template-meta"><span>{template.type}</span><span>{template.tasks.length} خطوات</span><span>{template.priority}</span></div>
      <details><summary>معاينة الخطة</summary><p className="template-preview">{template.instructions}</p><ol>{template.tasks.slice(0, 5).map((task) => <li key={task}>{task}</li>)}</ol></details>
      <button className="template-use" onClick={() => onUse(template)}>استخدام القالب</button>
    </article>)}</div>
    {!filtered.length && <div className="empty-state"><h3>لا توجد قوالب مطابقة</h3><p>غيّر كلمة البحث أو اختر فئة أخرى.</p></div>}
  </>
}
