# 📰 Auto News Ranking

ระบบจัดอันดับข่าวอัตโนมัติด้วย AI พร้อมโพสต์ไป Facebook

**Stack:** Next.js 14 + Supabase + Google Gemini + Apify

---

## ✨ Features

- 🕷️ **Crawler** — ดึงข่าวจาก Facebook Pages (Apify) + RSS Feeds
- 📝 **AI Summarizer** — สรุปข่าวด้วย Gemini
- 📊 **AI Analyzer** — วิเคราะห์และให้คะแนนความสำคัญ + Engagement
- 🏆 **Ranking Engine** — จัดอันดับ Top 5 / Trending
- ✍️ **Post Generator** — สร้าง Draft โพสต์สำหรับ Facebook
- 🚀 **Facebook Publisher** — โพสต์ไป Facebook Page ได้ทันที
- 📈 **Post Insights** — ดู Likes, Comments, Shares หลังโพสต์
- ⏰ **Auto Scheduler** — Cron ทุก 4 ชม. ด้วย Vercel

---

## 🚀 Getting Started

### 1. ติดตั้ง

```bash
npm install
```

### 2. ตั้งค่า Environment Variables

สร้างไฟล์ `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Gemini
GEMINI_API_KEY=your-gemini-api-key

# Apify (Dual Token System: สลับกลางเดือน)
APIFY_API_TOKEN=your-first-apify-token
APIFY_API_TOKEN_2=your-second-apify-token

# Facebook Page
FB_PAGE_ID=your-facebook-page-id
FB_PAGE_ACCESS_TOKEN=your-page-access-token
```

### 3. รัน Dev Server

```bash
npm run dev
```

---

## 📁 Project Structure

```
app/
├── page.tsx              # Dashboard
├── settings/page.tsx     # จัดการ Sources + Run AI
├── posts/approval/       # Review & Publish Posts
├── raw/page.tsx          # ดู Raw Data
├── api/
│   ├── crawl/           # Crawler (Apify + RSS)
│   ├── process/
│   │   ├── summarize/   # AI Summarizer
│   │   ├── analyze/     # AI Analyzer
│   │   ├── ranking/     # Ranking Engine
│   │   └── generate/    # Post Generator
│   └── posts/
│       ├── action/      # Approve/Delete/Update
│       ├── publish/     # Facebook Publisher
│       ├── delete/      # Delete from FB + DB
│       └── insights/    # Get Post Engagement
└── components/           # UI Components

prompts/
└── prompts.yml           # AI Prompts Configuration
```

---

## ⏰ Cron Schedule (Vercel)

| เวลา (UTC) | Action |
|-----------|--------|
| 01:00, 05:00, 09:00, 13:00, 17:00, 21:00 | Crawl + Summarize + Analyze |
| 11:00 | Ranking + Generate Posts |

---

## 📊 Database Schema (Supabase)

```
tracked_sources     — แหล่งข่าว (FB Pages, RSS)
news_raw            — ข่าวดิบ + Engagement
news_summary        — ข่าวที่สรุปแล้ว
news_analysis       — คะแนนวิเคราะห์
news_ranking_daily  — อันดับประจำวัน
generated_posts     — Draft โพสต์
```

---

## 🔑 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/crawl` | ดึงข่าวใหม่ |
| POST | `/api/process/summarize` | สรุปข่าว |
| POST | `/api/process/analyze` | วิเคราะห์+ให้คะแนน |
| POST | `/api/process/ranking` | จัดอันดับ |
| POST | `/api/process/generate` | สร้าง Draft โพสต์ |
| POST | `/api/posts/publish` | โพสต์ไป Facebook |
| POST | `/api/posts/action` | Approve/Update/Delete |
| GET | `/api/posts/insights` | ดู Engagement |

---

## 📝 License

MIT
