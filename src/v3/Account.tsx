export default function Account({ cloud, email, count, onSync, onLogout, onReset }: { cloud: boolean; email?: string; count: number; onSync: () => void; onLogout: () => unknown; onReset: () => void }) {
  return <>
    <header className="simple-header"><h1>حسابي</h1></header>
    <section className="profile-card"><div className="avatar">م</div><div><h2>{email?.split('@')[0] || 'الطالب'}</h2><p>{email || 'نسخة محلية'}</p></div></section>
    <section className="panel settings-list"><div><span>إجمالي التكليفات</span><strong>{count}</strong></div><div><span>التخزين</span><strong>{cloud ? 'Supabase' : 'هذا الجهاز'}</strong></div><div><span>الإصدار</span><strong>0.3.0</strong></div></section>
    {cloud ? <><button className="secondary-button" onClick={onSync}>مزامنة الآن</button><button className="secondary-button danger" onClick={() => void onLogout()}>تسجيل الخروج</button></> : <button className="secondary-button danger" onClick={onReset}>استعادة البيانات التجريبية</button>}
  </>
}
