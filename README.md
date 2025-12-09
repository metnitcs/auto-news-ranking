# Auto News Ranking (Skeleton)

โครงโปรเจกต์ตั้งต้นสำหรับระบบส่วนตัว:
ดึงข่าว · สรุป · จัดอันดับ · เตรียมโพสต์ ด้วย Next.js + Supabase + OpenAI

## ใช้งานเบื้องต้น

1. ติดตั้ง dependency

```bash
npm install
```

2. ตั้งค่า environment variables ใน `.env.local`

ต้องมีอย่างน้อย:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-...
```

3. รัน dev

```bash
npm run dev
```

4. ทดสอบ API สรุปข่าว

ส่ง `POST` ไปที่ `/api/test-summarize` ด้วย JSON:

```json
{
  "raw": "เนื้อหาข่าวดิบภาษาไทย"
}
```

จะได้ผลลัพธ์เป็น JSON ที่สรุปหัวข้อและ bullet คร่าว ๆ

จากโครงนี้คุณสามารถ:

- เพิ่มตารางใน Supabase สำหรับ news_summary, news_analysis, ranking ฯลฯ
- เพิ่ม API route สำหรับ crawl/process/generate/post
- สร้างหน้าแดชบอร์ดและหน้าอนุมัติโพสต์ให้ครบตามที่วางแผนไว้
