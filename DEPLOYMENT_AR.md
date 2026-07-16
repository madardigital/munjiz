# خطوات إطلاق النسخة التجريبية

## 1. إعداد Supabase

- إنشاء مشروع جديد.
- تنفيذ `supabase/schema.sql` كاملًا.
- من Authentication > URL Configuration، تحديد رابط الموقع وإضافة روابط التحويل.
- إبقاء تأكيد البريد مفعّلًا للنسخة العامة، أو تعطيله مؤقتًا للاختبار الداخلي فقط.

## 2. إعداد المشروع

أنشئ ملف `.env`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

ثم نفّذ:

```bash
npm install
npm run check
npm run build
```

## 3. النشر على Vercel

- ارفع المشروع إلى مستودع GitHub.
- استورد المستودع في Vercel.
- Framework Preset: Vite.
- Build Command: `npm run build`.
- Output Directory: `dist`.
- أضف متغيرات البيئة السابقة.
- بعد النشر، أضف رابط Vercel إلى إعدادات URL في Supabase.

## 4. اختبار القبول

- إنشاء حساب جديد وتأكيد البريد.
- تسجيل الدخول والخروج.
- إضافة تكليف وثلاث مهام.
- إغلاق التطبيق وفتحه والتأكد من بقاء البيانات.
- فتح الحساب من هاتف آخر والتأكد من ظهور التكليف.
- تعديل مهمة والتحقق من نسبة الإنجاز.
- حذف التكليف والتحقق من حذفه بعد إعادة التحميل.
- تثبيت PWA من المتصفح.
