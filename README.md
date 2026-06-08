---
title: "منظّم | Munazzim - نظام إدارة الوقت الذكي"
emoji: "🚀"
colorFrom: "blue"
colorTo: "indigo"
sdk: "docker"
app_port: 3000
pinned: false
---

# 🚀 منظّم | Munazzim - خارطة الطريق التقنية (NASA TRL)

## 📊 حالة الجاهزية الحالية: **TRL 5**
**التحقق من تكامل الأنظمة الفرعية في بيئة ذات صلة (Subsystem Integration)**

تم الانتقال بالمشروع من مجرد واجهات معملية (TRL 4) إلى نظام متكامل (TRL 5) حيث تتدفق البيانات بين الأنظمة الفرعية بشكل حي وحقيقي:

### 🛠 الأنظمة الفرعية المتكاملة (Integrated Subsystems):
1.  **نظام الهوية (Auth Subsystem):** تأمين الوصول وتخصيص البيانات لكل مستخدم عبر نظام محاكاة ذكي (Mock Auth) يتطور لاحقاً لـ Firebase.
2.  **نظام إدارة البيانات (Data Subsystem):** مزامنة المواعيد والمهام لحظياً بين واجهة المستخدم وقاعدة البيانات (LocalStorage/Firestore).
3.  **نظام التحليل (Analysis Subsystem):** لوحة قيادة (Dashboard) تقرأ البيانات الحقيقية لتقديم إحصائيات دقيقة ومؤشرات أداء (KPIs).

---

## 🏗 خارطة الطريق (NASA TRL Scale)

- [x] **TRL 4:** التحقق من المكونات والوظائف الأساسية في بيئة معملية.
- [x] **TRL 5 (الحالية):** دمج الأنظمة الفرعية والتحقق من تدفق البيانات الحقيقية واستقرار الحاويات (Docker).
- [ ] **TRL 6:** عرض نموذج أولي (Prototype) بمساعد ذكي "سياقي" كامل يقرأ جدول المستخدم ويحلله.
- [ ] **TRL 7:** عرض النظام في بيئة تشغيلية حقيقية مع معالجة أخطاء متقدمة وضغط بيانات.
- [ ] **TRL 8:** نظام مكتمل ومؤهل تماماً للاستخدام الفعلي (Flight Qualified).

---

## 💻 التقنيات المستخدمة (Technical Stack)
- **Framework:** Next.js 15 (Standalone Mode)
- **AI Engine:** Google Genkit (Gemini 1.5 Flash via OpenRouter)
- **UI Components:** ShadCN UI & Tailwind CSS
- **Infrastructure:** Dockerized for Hugging Face Spaces

---

## 📖 دليل التشغيل للمطورين
لتشغيل المشروع محلياً أو تحديثه:
1. `git add .`
2. `git commit -m "feat: reach TRL 5 with full subsystem integration"`
3. `git push -f origin main`
4. `git push -f hf main`

---
*تم تطوير هذا المشروع ليكون الحل الأمثل للمستخدم العربي الباحث عن الإنتاجية بنظام هندسي متين وفق معايير الجاهزية التقنية العالمية.*