# ✅ Auto-Approve System

## 🔄 ตอนนี้ Workflow เป็น:

```
Crawl → Summarize → Analyze → Rank → Generate → Auto-Approve → Auto-Post → Facebook
```

**ไม่ต้อง approve ด้วยตนเองแล้ว!** ✨

---

## 📅 GitHub Actions Schedule

| เวลา (TH) | Action |
|-----------|--------|
| 06:00, 12:00, 15:00, 18:00, 20:00 | Crawl → Generate → **Auto-Approve** |
| 20:30 | Generate Top 5 → **Auto-Approve** |
| 07:00, 13:00, 16:00, 19:00, 21:00 | **Auto-Approve** → **Auto-Post** |

---

## 🔧 Files Created/Modified

### New Files
1. `app/api/cron/auto-approve/route.ts` - Cron endpoint
2. `app/services/autoApprove.ts` - Service logic

### Modified Files
1. `.github/workflows/cron.yml` - Added auto-approve step
2. `app/api/cron/daily/route.ts` - Added auto-approve to pipeline

---

## 🚀 How It Works

### Daily Pipeline (Trending)
```
06:00 TH → Crawl → Summarize → Analyze → Rank → Generate Trending → Auto-Approve
```

### Top 5 Pipeline
```
20:30 TH → Generate Top 5 → Auto-Approve
```

### Auto-Post Pipeline
```
07:00 TH → Auto-Approve (if any draft) → Auto-Post to Facebook
```

---

## ✨ Benefits

✅ Fully automated - no manual approval needed
✅ Posts go live automatically on schedule
✅ Reduces manual work
✅ Consistent posting schedule

---

## 📝 Manual Override

ถ้าต้องการ approve เฉพาะบางโพสต์:
1. ไปที่ Dashboard
2. ดู Pending Posts
3. Approve/Reject ตามต้องการ
4. Auto-post จะโพสต์เฉพาะ approved posts

---

## 🔐 Security

- Auto-approve ใช้ Bearer Token เหมือน auto-post
- ไม่มี public endpoint
- ทำงานผ่าน GitHub Actions เท่านั้น

---

## 🛠️ Troubleshooting

**Posts ไม่ auto-approve?**
- ตรวจสอบ GitHub Actions logs
- ตรวจสอบ CRON_SECRET ถูกต้อง

**ต้องการหยุด auto-approve?**
- ลบ auto-approve step จาก workflow
- หรือ disable GitHub Actions

---

## 📊 Database

Posts จะมี status:
- `draft` → `approved` (auto-approve) → `posted` (auto-post)

ไม่มี manual approval step แล้ว!
