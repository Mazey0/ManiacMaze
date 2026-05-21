# iMaze — تطبيق المتاهات الفنية

تطبيق ويب عربي متجاوب (PWA) لحل المتاهات الفنية المرسومة يدويًا.

---

## خطوات التشغيل

### 1. إعداد Supabase

1. انتقل إلى [supabase.com](https://supabase.com) — **New Project**
2. في **Settings → API** انسخ:
   - `Project URL`
   - `anon public` key
3. في **SQL Editor** شغّل كامل ملف `SUPABASE_SETUP.sql`
4. في **Storage → Buckets** أنشئ ثلاثة بكتات:
   - `maze-originals` — خاص (ملفات الرفع الأصلية)
   - `maze-processed` — **عام** (الصور المعالجة) — فعّل "Public bucket" ✓
   - `attempt-images` — خاص (صور تصدير الحلول)
5. في **Authentication → Users** أنشئ حساب الأدمن بالبريد وكلمة المرور

### 2. ملف البيئة

```bash
cp .env.example .env
# ثم افتح .env وأضف مفاتيح Supabase
```

### 3. التشغيل

```bash
npm install
npm run dev
# http://localhost:5173
```

---

## بنية الملفات

```
src/
├── lib/supabase.js           ← إعداد Supabase + أسماء الجداول والبكتات
├── store/
│   ├── authStore.js          ← تسجيل دخول الأدمن
│   ├── mazeStore.js          ← بيانات المتاهات
│   └── solverStore.js        ← جلسة الحل (رسم + عداد + حفظ مؤقت)
├── hooks/useViewport.js      ← تكبير/تحريك واجهة الحل
├── components/
│   ├── DrawingCanvas.jsx     ← لوحة الرسم (Apple Pencil/لمس/ماوس)
│   ├── ZoneOverlay.jsx       ← مناطق البداية/النهاية SVG
│   ├── PDFPicker.jsx         ← اختيار صفحة من PDF + اقتصاص تلقائي
│   └── Timer.jsx             ← عداد الوقت
└── pages/
    ├── HomePage.jsx
    ├── GalleryPage.jsx
    ├── SolverPage.jsx        ← واجهة الحل الكاملة
    └── Admin/
        ├── AdminLogin.jsx
        ├── AdminDashboard.jsx
        ├── AdminUpload.jsx   ← رفع PDF + قص + بيانات (5 خطوات)
        ├── AdminMazeEdit.jsx ← تحديد نقطتي البداية والنهاية
        ├── AdminAttempts.jsx ← عرض المحاولات
        └── AdminReplay.jsx   ← إعادة تشغيل الحل مع تحكم بالسرعة
```

---

## المسارات

| المسار | الوصف |
|--------|-------|
| `/` | الرئيسية |
| `/gallery` | معرض المتاهات |
| `/solve/:id` | حل متاهة |
| `/admin/login` | تسجيل دخول الأدمن |
| `/admin` | لوحة التحكم |
| `/admin/upload` | رفع متاهة جديدة |
| `/admin/maze/:id` | تعديل + تحديد نقاط البداية/النهاية |
| `/admin/attempts/:id` | محاولات المستخدمين |
| `/admin/replay/:attemptId` | إعادة تشغيل حل |

---

## ملاحظات تقنية

**وضع التدريب (الحالي):** العداد يتوقف عند مغادرة الصفحة.
لتحويله لوضع تحدي: احذف `visibilitychange` listener في `SolverPage.jsx`.

**كشف الجدران:** غير مُفعَّل في MVP — الكشف الحالي يتحقق فقط من لمس منطقتي البداية والنهاية.
مكان التطوير: `SolverPage.jsx → handleZoneCheck`.

**رفع PDF:** يُعرض كصفحات مصغرة → اختيار الصفحة → رسم بدقة 3× → اقتصاص تلقائي → تعديل يدوي اختياري.
