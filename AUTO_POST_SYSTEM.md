# 📤 Auto-Post System

ระบบโพสต์ข่าวไปยัง Facebook Page โดยอัตโนมัติ

---

## 🔄 Workflow

```
Draft Posts (status='draft')
    ↓
User Approves (status='approved')
    ↓
Auto-Post Cron (every 07, 13, 16, 19, 21 TH)
    ↓
Published to Facebook (status='posted')
```

---

## ⏰ Schedule

| เวลา (TH) | เวลา (UTC) | Action |
|-----------|-----------|--------|
| 07:00 | 00:00 | Auto-post approved posts |
| 13:00 | 06:00 | Auto-post approved posts |
| 16:00 | 09:00 | Auto-post approved posts |
| 19:00 | 12:00 | Auto-post approved posts |
| 21:00 | 14:00 | Auto-post approved posts |

---

## 🔧 Components

### 1. Cron Endpoint
**File**: `app/api/cron/auto-post/route.ts`

- Triggered by GitHub Actions on schedule
- Requires Bearer Token authentication
- Fetches approved posts (max 5 per run)
- Posts to Facebook Graph API
- Updates post status to 'posted'

### 2. Manual Endpoint
**File**: `app/api/posts/auto-post/route.ts`

- Triggered from Settings page
- No authentication required (internal use)
- Accepts `limit` parameter (default: 5)
- Returns posted count and failed count

### 3. Service
**File**: `app/services/autoPost.ts`

- Core logic for publishing to Facebook
- Handles both image posts and text-only posts
- Manages rate limiting (2s delay between posts)
- Updates database with Facebook post ID

### 4. UI Button
**File**: `app/settings/page.tsx`

- "Auto-Post" button in Individual Steps section
- Shows real-time status during posting
- Displays success/failure count

---

## 📊 Database

### generated_posts table
```sql
status: 'draft' | 'approved' | 'scheduled' | 'posted' | 'failed'
posted_at: timestamptz (null until posted)
payload: jsonb (contains fb_post_id after posting)
```

### Indexes
```sql
idx_generated_posts_status
idx_generated_posts_posted_at
```

---

## 🚀 Usage

### Manual Trigger (from UI)
1. Go to Settings page
2. Click "Auto-Post" button in Individual Steps
3. Wait for posts to be published

### Automatic Trigger (GitHub Actions)
- Runs on schedule: 07, 13, 16, 19, 21 TH
- Requires `APP_URL` and `CRON_SECRET` in GitHub Secrets

### API Call
```bash
curl -X POST https://your-app.vercel.app/api/posts/auto-post \
  -H "Content-Type: application/json" \
  -d '{"limit": 5}'
```

---

## 🔐 Security

- Cron endpoint requires Bearer Token (`CRON_SECRET`)
- Manual endpoint is internal (no auth needed)
- Facebook credentials stored in environment variables
- Rate limiting: 2s delay between posts

---

## 📝 Post Types

### With Image
- Uses Facebook `/photos` endpoint
- Sends image URL + caption

### Text Only
- Uses Facebook `/feed` endpoint
- Sends message only

---

## ⚠️ Error Handling

- Failed posts are logged but don't stop the process
- Returns count of posted vs failed
- Database is updated only on success
- Facebook API errors are caught and reported

---

## 🔗 Related Endpoints

- `POST /api/posts/publish` - Manual publish single post
- `POST /api/posts/action` - Approve/Update/Delete draft
- `GET /api/posts/insights` - Get post engagement
- `DELETE /api/posts/delete` - Delete from FB + DB

---

## 📈 Monitoring

Check posted posts:
```sql
SELECT * FROM generated_posts 
WHERE status = 'posted' 
ORDER BY posted_at DESC;
```

Check failed posts:
```sql
SELECT * FROM generated_posts 
WHERE status = 'failed' 
ORDER BY created_at DESC;
```

---

## 🛠️ Troubleshooting

### Posts not posting
1. Check if posts are in 'approved' status
2. Verify Facebook credentials in .env
3. Check GitHub Actions logs
4. Verify `CRON_SECRET` matches

### Facebook API errors
- Check token expiration
- Verify page ID is correct
- Check image URL is accessible
- Review Facebook API rate limits

### Database issues
- Verify `generated_posts` table exists
- Check `posted_at` index is created
- Ensure service role key has write access
