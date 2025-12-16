# ✅ Auto-Post System Implementation Summary

## 📦 Files Created/Modified

### New Files Created

1. **`app/api/cron/auto-post/route.ts`**
   - Cron endpoint for automatic posting
   - Fetches approved posts and publishes to Facebook
   - Requires Bearer Token authentication
   - Max 5 posts per run with 2s delay between posts

2. **`app/services/autoPost.ts`**
   - Core service for auto-posting logic
   - Handles both image and text-only posts
   - Manages Facebook Graph API calls
   - Updates database with post status

3. **`app/api/posts/auto-post/route.ts`**
   - Manual trigger endpoint for UI
   - Accepts limit parameter
   - Returns posted/failed counts

4. **`AUTO_POST_SYSTEM.md`**
   - Comprehensive documentation
   - Workflow diagrams
   - Troubleshooting guide

### Modified Files

1. **`.github/workflows/cron.yml`**
   - Added auto-post schedule (07, 13, 16, 19, 21 TH)
   - Added `auto-post` option to workflow_dispatch
   - Updated job type detection logic

2. **`app/settings/page.tsx`**
   - Added "Auto-Post" button to Individual Steps
   - Updated handleSingleStep to support auto-post
   - Changed grid from 2 to 3 columns

3. **`supabase/schema.sql`**
   - Added `tracked_sources` table
   - Added indexes for `generated_posts` (status, posted_at)

4. **`README.md`**
   - Added auto-post to features
   - Updated cron schedule table
   - Added auto-post endpoints documentation

---

## 🔄 Workflow

```
Draft Posts (status='draft')
    ↓
User Approves (status='approved')
    ↓
Auto-Post Cron (5 times daily)
    ↓
Published to Facebook (status='posted')
```

---

## ⏰ Schedule

| Time (TH) | Time (UTC) | Frequency |
|-----------|-----------|-----------|
| 07:00 | 00:00 | Daily |
| 13:00 | 06:00 | Daily |
| 16:00 | 09:00 | Daily |
| 19:00 | 12:00 | Daily |
| 21:00 | 14:00 | Daily |

---

## 🔐 Security

- Bearer Token authentication for cron endpoints
- Facebook credentials in environment variables
- Rate limiting (2s delay between posts)
- Error handling without stopping process

---

## 📊 Database Changes

### New Table: `tracked_sources`
```sql
id (UUID)
type (rss | facebook_page)
name (VARCHAR)
source_id (TEXT)
is_active (BOOLEAN)
created_at (TIMESTAMPTZ)
```

### New Indexes
```sql
idx_generated_posts_status
idx_generated_posts_posted_at
```

---

## 🚀 Usage

### From UI (Settings Page)
1. Click "Auto-Post" button
2. System posts up to 5 approved posts
3. Shows success/failure count

### From GitHub Actions
- Runs automatically 5 times daily
- Requires `CRON_SECRET` in GitHub Secrets

### From API
```bash
curl -X POST https://your-app.vercel.app/api/posts/auto-post \
  -H "Content-Type: application/json" \
  -d '{"limit": 5}'
```

---

## 🔗 Integration Points

- **Crawler** → Creates `news_raw`
- **Summarizer** → Creates `news_summary`
- **Analyzer** → Creates `news_analysis`
- **Ranker** → Creates `news_ranking_daily`
- **Generator** → Creates `generated_posts` (status='draft')
- **User** → Approves posts (status='approved')
- **Auto-Post** → Posts to Facebook (status='posted')

---

## ✨ Features

✅ Automatic posting on schedule
✅ Manual trigger from UI
✅ Image + text post support
✅ Rate limiting
✅ Error handling
✅ Database tracking
✅ Facebook Graph API integration
✅ Bearer token security

---

## 📝 Next Steps

1. Run database migration to create `tracked_sources` table
2. Add news sources via Settings page
3. Run full pipeline (Crawl → Summarize → Analyze → Rank → Generate)
4. Approve posts in dashboard
5. Auto-post will run on schedule or manually trigger

---

## 🐛 Troubleshooting

**Posts not posting?**
- Check if posts are in 'approved' status
- Verify Facebook credentials
- Check GitHub Actions logs
- Verify CRON_SECRET matches

**Facebook API errors?**
- Check token expiration
- Verify page ID
- Check image URL accessibility
- Review rate limits

**Database issues?**
- Verify tables exist
- Check indexes created
- Ensure service role has write access
