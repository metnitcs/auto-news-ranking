# 📰 Auto News Ranking

ระบบจัดอันดับข่าวอัตโนมัติด้วย AI พร้อมโพสต์ไป Facebook

**Stack:** Next.js 15 + TypeScript + Supabase + Google Gemini 2.0 Flash + Apify + GitHub Actions

---

## ✨ Features

### 🤖 AI-Powered Pipeline
- 🕷️ **Smart Crawler** — ดึงข่าวจาก Facebook Pages (Apify) + RSS Feeds พร้อม Dual Token System
- 📝 **AI Summarizer** — สรุปข่าวด้วย Gemini 2.0 Flash + Prompt Engineering (YAML-based)
- 📊 **AI Analyzer** — วิเคราะห์คะแนนความสำคัญ, ผลกระทบ, เทรนด์โซเชียล, ความเร่งด่วน
- 🏆 **Ranking Engine** — จัดอันดับอัจฉริยะ: Top 5, Trending, Hidden Gems
- ✍️ **Post Generator** — สร้าง Draft โพสต์ + Infographic อัตโนมัติ

### 📱 Social Media Management
- 🚀 **Facebook Publisher** — โพสต์ไป Facebook Page ได้ทันที
- 📤 **Auto-Post System** — โพสต์ approved posts โดยอัตโนมัติตามตารางเวลา
- 📈 **Post Insights** — ติดตาม Likes, Comments, Shares แบบ Real-time
- 🎨 **Auto Infographic** — สร้างภาพประกอบด้วย Satori + SVG

### ⚙️ Automation & Monitoring
- ⏰ **GitHub Actions Scheduler** — รันอัตโนมัติทุก 4 ชม. (แยก Trending/Top5/Auto-Post)
- 🔄 **Rate Limit Handler** — Exponential Backoff สำหรับ Gemini API
- 🛡️ **Security** — Bearer Token Authentication สำหรับ Cron

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

# Cron Security
CRON_SECRET=your-random-secret-key
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
│   ├── cron/
│   │   ├── daily/       # Full pipeline
│   │   ├── generate-top5/  # Top 5 only
│   │   └── auto-post/   # Auto-post to Facebook
│   └── posts/
│       ├── action/      # Approve/Delete/Update
│       ├── publish/     # Facebook Publisher
│       ├── auto-post/   # Manual auto-post trigger
│       ├── delete/      # Delete from FB + DB
│       └── insights/    # Get Post Engagement
└── components/           # UI Components

prompts/
└── prompts.yml           # AI Prompts Configuration
```

---

## ⏰ Cron Schedule (GitHub Actions)

เนื่องจาก Vercel Hobby Plan จำกัด Cron 1 ครั้ง/วัน เราจึงใช้ GitHub Actions รันอัตโนมัติ

### 📅 Schedule

| เวลา (TH) | เวลา (UTC) | Endpoint | Action |
|-----------|-----------|----------|--------|
| 06:00, 12:00, 15:00, 18:00, 20:00 | 23:00, 05:00, 08:00, 11:00, 13:00 | `/api/cron/daily` | Crawl → Summarize → Analyze → Rank → Generate **Trending** |
| 20:30 | 13:30 | `/api/cron/generate-top5` | Generate **Daily Top 5** |
| 07:00, 13:00, 16:00, 19:00, 21:00 | 00:00, 06:00, 09:00, 12:00, 14:00 | `/api/cron/auto-post` | Auto-post **approved posts** to Facebook |

### 🔧 การตั้งค่า GitHub Secrets

ไปที่ **Settings > Secrets and variables > Actions** แล้วเพิ่ม:

```
APP_URL=https://your-project.vercel.app
CRON_SECRET=your-random-secret-key
```

⚠️ **สำคัญ:** `APP_URL` ต้องเป็น `https://` และไม่มี `/` ท้าย

### 🎯 Manual Trigger

สามารถรันด้วยตนเองได้ที่ **Actions > Auto News Cron > Run workflow**
- เลือก `trending` = รันกระบวนการเต็ม + สร้างโพสต์ Trending
- เลือก `top5` = สร้างโพสต์ Top 5 เท่านั้น
- เลือก `auto-post` = โพสต์ approved posts ไปยัง Facebook

---

## 📊 Database Schema (Supabase)

```sql
tracked_sources     — แหล่งข่าว (FB Pages, RSS) + is_active flag
news_raw            — ข่าวดิบ + Engagement (likes, shares, comments, reactions)
news_summary        — ข่าวที่สรุปแล้ว (title, bullets, entities, time_context)
news_analysis       — คะแนนวิเคราะห์ (importance, impact, urgency, social_trend, risk)
news_ranking_daily  — อันดับประจำวัน (ranked_list, top5, trending, hidden_gems)
generated_posts     — Draft โพสต์ (content, image_url, status, posted_at)
```

**Key Features:**
- UUID Primary Keys
- Cascade Delete (ลบข่าวดิบ = ลบข้อมูลที่เกี่ยวข้องทั้งหมด)
- JSONB สำหรับ Flexible Data (meta, bullets, entities)
- Unique Constraint (source + source_id) = ป้องกันข่าวซ้ำ

---

## 🔑 API Endpoints

### 🤖 Automation (Cron)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/cron/daily` | รันกระบวนการเต็ม (Crawl → Summarize → Analyze → Rank → Generate Trending) | Bearer Token |
| GET | `/api/cron/generate-top5` | สร้างโพสต์ Top 5 เท่านั้น | Bearer Token |
| GET | `/api/cron/auto-post` | โพสต์ approved posts ไปยัง Facebook | Bearer Token |

### 📰 News Processing
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/crawl` | ดึงข่าวจาก Facebook + RSS |
| POST | `/api/process/summarize` | สรุปข่าวด้วย AI |
| POST | `/api/process/analyze` | วิเคราะห์คะแนน |
| POST | `/api/process/ranking` | จัดอันดับข่าว |
| POST | `/api/process/generate` | สร้าง Draft โพสต์ |

### 📱 Post Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/posts/publish` | โพสต์ไป Facebook Page (manual) |
| POST | `/api/posts/auto-post` | Auto-post approved posts (manual trigger) |
| POST | `/api/posts/action` | Approve/Update/Delete Draft |
| DELETE | `/api/posts/delete` | ลบโพสต์จาก Facebook + DB |
| GET | `/api/posts/insights` | ดู Engagement (Likes, Comments, Shares) |

---

## 🎨 Prompt Engineering

ระบบใช้ **YAML-based Prompt Configuration** (`prompts/prompts.yml`) สำหรับ:

- **Summarizer** — สรุปข่าวแบบ Bullet Points + Extract Entities
- **Analyzer** — ให้คะแนน 5 มิติ (Importance, Impact, Urgency, Social Trend, Risk)
- **Ranker** — จัดอันดับด้วย Weighted Scoring (40% Importance + 40% Impact + 20% Social)
- **Post Generator** — 3 Variants: `daily_top5`, `trending_now`, `hidden_news`

**Features:**
- Template Variables (`{{variable}}`)
- Tone Configuration (neutral_explain, friendly, analytic)
- JSON Mode สำหรับ Structured Output
- Anti-Copy Ratio = 0.0 (ห้าม Copy ตรงจากต้นฉบับ)

## 🔐 Security

- ✅ Bearer Token Authentication สำหรับ Cron Endpoints
- ✅ Environment Variables สำหรับ Secrets
- ✅ Supabase RLS (Row Level Security) Ready
- ✅ Rate Limit Handling (Exponential Backoff)

## 🚀 Deployment

### Vercel
```bash
vercel --prod
```

### Environment Variables (Production)
ตั้งค่าใน Vercel Dashboard:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GEMINI_API_KEY
APIFY_API_TOKEN
APIFY_API_TOKEN_2
FB_PAGE_ID
FB_PAGE_ACCESS_TOKEN
CRON_SECRET
```

## 🛠️ Tech Stack Details

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Frontend** | Next.js 15 (App Router) | React Framework |
| | TypeScript | Type Safety |
| | Tailwind CSS | Styling |
| | SweetAlert2 | UI Alerts |
| **Backend** | Next.js API Routes | Serverless Functions |
| | Supabase | PostgreSQL Database |
| **AI/ML** | Google Gemini 2.0 Flash | LLM (Summarize, Analyze, Generate) |
| | Prompt Engineering (YAML) | Structured Prompts |
| **Crawler** | Apify (Facebook Scraper) | Facebook Posts |
| | rss-parser | RSS Feeds |
| **Image** | Satori | HTML → SVG |
| | @resvg/resvg-js | SVG → PNG |
| **Automation** | GitHub Actions | Cron Scheduler |
| **Social** | Facebook Graph API | Post Publishing + Insights |

## 📚 Documentation

- [Auto-Post System](./AUTO_POST_SYSTEM.md) — Detailed auto-post workflow

## 📝 License

MIT

---

**Made with ❤️ for Thai News Community**
