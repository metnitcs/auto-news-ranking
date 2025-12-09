PRD — Auto News Ranking System

Version 1.0 — Full Detailed Specification (Markdown Edition)
Creator: คุณ
Purpose: ระบบอัตโนมัติสำหรับดึงข่าว, สรุป, วิเคราะห์, จัดอันดับ และสร้างโพสต์รออนุมัติ พร้อมตั้งเวลาโพสต์บน Facebook

1. Overview
1.1 Product Summary

Auto News Ranking System คือระบบที่ช่วยให้ผู้ใช้สามารถ:

ดึงข่าวจากหลายแหล่ง (เช่น Fanpage ข่าว 10 เพจ)

ทำการสรุปข่าวอัตโนมัติด้วย AI

วิเคราะห์ความสำคัญ, ผลกระทบ, กระแสสังคม

จัดอันดับข่าวประจำวัน (Top5, Trending, Hidden Gems)

สร้างโพสต์พร้อมใช้งาน โดยรอให้ผู้ใช้ตรวจสอบ/อนุมัติ

ตั้งเวลาโพสต์อัตโนมัติขึ้น Facebook Page

ระบบจะรันแบบ serverless (Next.js + Vercel Cron) พร้อมใช้ฐานข้อมูลบน Supabase

2. Objectives

ลดเวลาการจัดการข่าวรายวัน

ทำคอนเทนต์แบบ "เพจข่าวจัดอันดับ" อัตโนมัติ

สร้างโพสต์คุณภาพสูงแบบ rewrite ไม่ละเมิดลิขสิทธิ์

รองรับการเติบโต เช่น เพิ่มแหล่งข่าว, เพิ่มรูปแบบโพสต์

ให้ผู้ใช้มีแดชบอร์ดจัดการงานทั้งหมดในหน้าเดียว

3. Scope
3.1 In Scope

News Crawler (Facebook Graph API / RSS / Manual Feed)

AI Summarization

AI Analysis (importance / impact / trend scoring)

Ranking Engine

Post Generator (Top 5 / Trending / Hidden News)

Approval Workflow (draft → approved → scheduled → posted)

Scheduler สำหรับ daily tasks

Facebook Publisher Integration

Dashboard UI

Logging & Error handling

Prompt Engine (config-driven)

3.2 Out of Scope

Realtime monitoring / websocket

การวิเคราะห์ภาพข่าว

AI ตรวจสอบลิขสิทธิ์เชิงลึก

Multi-user roles (เวอร์ชันแรกมี user คนเดียว)

4. User Roles
Admin (คุณ)

ตั้งค่าเพจเป้าหมาย

ดูรายการข่าวดิบ / ข่าวสรุป / ranking ของวัน

แก้ไขเนื้อหาโพสต์ที่ AI สร้าง

อนุมัติและตั้งเวลาโพสต์

ตรวจ Logs

Trigger manual run: Crawl / Process / Generate

System

ดึงข่าวตามเวลาที่กำหนด

สรุป-วิเคราะห์ข่าวด้วย AI

จัดอันดับข่าว

เตรียมโพสต์อัตโนมัติ

ตั้งเวลาโพสต์

โพสต์จริงผ่าน Facebook Graph API

5. Functional Requirements
5.1 News Crawler Module
Features

ดึงข่าวจาก:

Facebook Pages ผ่าน Graph API

RSS feeds

Web Scraping (fallback)

เก็บข้อมูล:

title

content

published_at

source page

raw JSON response

ป้องกัน duplicate ด้วย source_id + hash

API
POST /api/crawl


Response:

{
  "inserted": 25,
  "skipped": 12
}

5.2 AI Summarizer Module
Input:

raw news content

title

metadata

Output:

rewritten title

3–5 bullet summary

key entities

time context

Requirements:

ต้อง rewrite ใหม่ 100%

ห้าม copy จากต้นฉบับ

ต้อง output เป็น JSON

5.3 AI Analyzer Module
วิเคราะห์:

importance_score (1–10)

impact_score (1–10)

social_trend_score (1–10)

urgency_score (1–10)

category

risk_of_misunderstanding

short_insight (1–2 บรรทัด)

API:
POST /api/process/analyze

5.4 Ranking Engine
คะแนนรวม:
Total Score = (Importance 40%) + (Impact 40%) + (Trend 20%)

Output:

ranked list (desc)

top5

trending (3 items)

hidden_gems (2 items low-score but meaningful)

5.5 Post Generator (AI)
รูปแบบโพสต์ที่รองรับ

Top 5 News of The Day

Trending Now

Hidden News You Might Missed

Output:

post_id

type

text_content

sources used

prompt metadata

5.6 Approval Workflow
State Machine:
draft → approved → scheduled → posted

Actions:

Edit post text

Approve

Schedule datetime

Publish now

5.7 Scheduler
Daily Tasks:

07:00 — Crawl news

08:00 — Process summarizer + analyzer

09:00 — Generate Top5 post (draft)

18:00 — Publish scheduled posts

Tech:

Vercel Cron → API routes

5.8 Facebook Publisher
Features:

publish text post

support scheduled posts

error retry system

API:
POST /api/posts/publish

6. Non-Functional Requirements
Performance

รองรับข่าววันละ 100–300 ข่าวได้

Summarizer ≤ 3 seconds per item

Reliability

Retry 3 ครั้งเมื่อ publish ล้มเหลว

Logging ทุกขั้นตอน

Security

ENV-based secrets

Facebook tokens อยู่เฉพาะฝั่ง server

Usability

Dashboard ต้องอ่านง่าย ใช้สีช่วยแบ่งสถานะข่าว

7. System Architecture
Components:

Next.js (Frontend + Backend API)

Supabase (Postgres)

OpenAI API

Vercel Cron

Facebook Graph API

Prompt Engine (local config-driven)

High-level Flow:
[Vercel Cron] → /api/crawl 
                ↓
         [Supabase: news_raw]
                ↓
        /api/process (summarizer + analyzer)
                ↓
       [news_summary + news_analysis]
                ↓
       /api/process/ranking
                ↓
          [news_ranking_daily]
                ↓
        /api/posts/generate
                ↓
        [generated_posts: draft]
                ↓
         Admin edits + approves
                ↓
    Scheduler calls /api/posts/publish
                ↓
          Facebook Page Post

8. Database Schema (Initial)
8.1 news_raw
Field	Type	Description
id	uuid PK	unique id
source	varchar	facebook / rss
source_id	text	ID ของโพสต์ต้นทาง
title	text	title ของข่าว
content	text	raw content
meta	jsonb	raw API response
created_at	timestamptz	timestamp
8.2 news_summary
Field	Type	Description
id	uuid PK	links to news_raw
title_rewritten	text	rewrite
bullets	jsonb	array of summary
entities	jsonb	named entities
time_context	text	extracted time
created_at	timestamptz	
8.3 news_analysis
Field	Type	Description
id	uuid PK	links to news_raw
importance_score	int	1–10
impact_score	int	1–10
social_trend_score	int	1–10
urgency_score	int	1–10
risk_of_misunderstanding	int	1–10
category	varchar	
insight	text	
created_at	timestamptz	
8.4 news_ranking_daily

| Field | Type |
| id | uuid PK |
| rank_date | date |
| ranked_list | jsonb |
| top5 | jsonb |
| trending | jsonb |
| hidden_gems | jsonb |

8.5 generated_posts

| Field | Type |
| id | uuid PK |
| type | varchar |
| payload | jsonb |
| content | text |
| status | varchar (draft/approved/scheduled/posted) |
| scheduled_at | timestamptz |
| posted_at | timestamptz |
| created_at | timestamptz |

9. API Specification (Initial)
9.1 POST /api/crawl

ดึงข่าวจากเพจ/แหล่งข่าวทั้งหมด

9.2 POST /api/process/summarize

สรุปข่าวทีละรายการ

9.3 POST /api/process/analyze

วิเคราะห์คะแนนข่าว

9.4 POST /api/process/ranking

จัดอันดับข่าวประจำวัน

9.5 POST /api/posts/generate

สร้างโพสต์อัตโนมัติ

9.6 POST /api/posts/schedule

ตั้งเวลาโพสต์

9.7 POST /api/posts/publish

โพสต์จริงขึ้น Facebook

10. Prompt Engine Specification
Files:

prompts/prompts.yml

src/lib/promptEngine.ts

Required tasks:

summarizer

analyzer

ranker

post_generator

Required behavior:

รองรับ placeholder เช่น {{raw_content}}

อ่านค่าจากไฟล์ .yml

คืนค่าเป็น { model, messages, temperature }

11. Workflow Summary
1) Crawl → เก็บข่าวลง news_raw
2) Summarize → เขียนใหม่ → news_summary
3) Analyze → ให้คะแนน → news_analysis
4) Ranking → จัดอันดับ → news_ranking_daily
5) Generate Post → สร้างโพสต์ → generated_posts(draft)
6) Admin Approve → edit + approve
7) Scheduler → publish → Facebook

12. Milestones / Roadmap
Phase 1 – Core Data Flow

Implement news_raw, summarizer, analyzer

Phase 2 – Ranking Engine

Logic total score

Generate ranked JSON

Phase 3 – Post Generator

Templates + AI rewrite

Phase 4 – Dashboard UI

Show news summary + ranking + posts

Phase 5 – Approval Flow

Approve / edit / schedule

Phase 6 – Facebook Publisher

Publish text posts

Handle retry

Phase 7 – Production Deployment

Vercel + Supabase migration

Cron jobs

Logging

13. Risks & Mitigation
Risk	Impact	Mitigation
AI summary copy from news	Legal	Strict rewrite in prompt
Facebook API quota	High	Cache + fallback logic
Cron job fail	Medium	Logging + retry
Duplicate news	Medium	source_id + hash check
14. Acceptance Criteria

ระบบสามารถสร้าง Top 5 Post อัตโนมัติได้ทุกวัน

Rewrite สรุปข่าวไม่ซ้ำต้นฉบับ

Ranking ถูกต้องตามสูตร

Admin สามารถอนุมัติ/แก้ไขโพสต์ได้

ตั้งเวลา + Publish ทำงานอัตโนมัติ

Dashboard อ่านง่ายและลื่น

END OF PRD