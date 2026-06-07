# مرحلة البناء
FROM node:20-alpine AS builder
WORKDIR /app

# تثبيت التبعيات
COPY package.json package-lock.json* ./
RUN npm install

# نسخ الكود وبناء التطبيق
COPY . .
RUN npm run build

# مرحلة التشغيل
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# إنشاء مستخدم غير روت للأمان
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# نسخ الملفات اللازمة من مرحلة البناء
# نستخدم حيلة الشرط لضمان عدم فشل البناء إذا كان المجلد فارغاً
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
