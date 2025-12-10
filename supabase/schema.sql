-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. news_raw
create table public.news_raw (
  id uuid primary key default uuid_generate_v4(),
  source varchar(50) not null, -- 'facebook', 'rss', 'manual'
  source_id text not null, -- Unique ID from source (e.g., FB Post ID)
  title text,
  content text,
  meta jsonb default '{}'::jsonb, -- Store raw API response
  created_at timestamptz default now(),
  
  unique(source, source_id) -- Prevent duplicates
);

-- 2. news_summary
create table public.news_summary (
  id uuid primary key references public.news_raw(id) on delete cascade,
  title_rewritten text,
  bullets jsonb, -- Array of strings
  entities jsonb, -- Array of named entities
  time_context text,
  created_at timestamptz default now()
);

-- 3. news_analysis
create table public.news_analysis (
  id uuid primary key references public.news_raw(id) on delete cascade,
  importance_score int check (importance_score between 1 and 10),
  impact_score int check (impact_score between 1 and 10),
  social_trend_score int check (social_trend_score between 1 and 10),
  urgency_score int check (urgency_score between 1 and 10),
  risk_of_misunderstanding int check (risk_of_misunderstanding between 1 and 10),
  category varchar(100),
  insight text,
  created_at timestamptz default now()
);

-- 4. news_ranking_daily
create table public.news_ranking_daily (
  id uuid primary key default uuid_generate_v4(),
  rank_date date not null unique,
  ranked_list jsonb, -- Full ordered list with scores
  top5 jsonb, -- Selected Top 5
  trending jsonb, -- Selected Trending
  hidden_gems jsonb, -- Selected Hidden Gems
  created_at timestamptz default now()
);

-- 5. generated_posts
create table public.generated_posts (
  id uuid primary key default uuid_generate_v4(),
  type varchar(50) not null, -- 'top5', 'trending', 'hidden_gems'
  payload jsonb, -- Data used to generate the post
  content text, -- Final post content (Draft/Approved)
  image_url text, -- URL of the generated infographic
  status varchar(20) default 'draft' check (status in ('draft', 'approved', 'scheduled', 'posted', 'failed')),
  scheduled_at timestamptz,
  posted_at timestamptz,
  created_at timestamptz default now()
);

-- Create indexes for performance
create index idx_news_raw_created_at on public.news_raw(created_at);
create index idx_news_ranking_date on public.news_ranking_daily(rank_date);
