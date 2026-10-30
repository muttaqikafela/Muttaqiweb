-- ============================================================
-- Muttaqi Hajj & Consultancy (মুত্তাকী হজ্ব ও কনসালটেন্সি)
-- Complete Supabase PostgreSQL Schema & Storage Setup
-- Project ID: nxsvorwevdbpdqyobvua
-- Target URL: https://nxsvorwevdbpdqyobvua.supabase.co
--
-- HOW TO USE:
-- 1. Open your Supabase Dashboard:
--    https://supabase.com/dashboard/project/nxsvorwevdbpdqyobvua/sql/new
-- 2. Paste this entire script into the SQL Editor.
-- 3. Click the green "RUN" button.
-- 4. All 18+ tables, 5 dynamic views, 3 storage buckets and full RLS policies will be created safely!
-- ============================================================

-- Enable pgcrypto for UUIDs & cryptographic functions
create extension if not exists pgcrypto;

-- ============================================================
-- 1. অনুমোদন কেন্দ্র ও আবেদন ট্র্যাকিং (APPROVALS & AUDIT LOGS)
-- ============================================================
create table if not exists public.approvals (
  id text primary key default gen_random_uuid()::text,
  inquiry_id text not null,
  haji_user_id text,
  haji_name text not null,
  haji_phone text,
  request_type text default 'registration', -- 'registration' | 'discount' | 'group_change' | 'cancellation'
  status text not null default 'pending',    -- 'pending' | 'approved' | 'rejected'
  submitted_at timestamptz default now(),
  reviewed_at timestamptz,
  reviewed_by text,
  admin_notes text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.approval_logs (
  id text primary key default gen_random_uuid()::text,
  approval_id text,
  inquiry_id text not null,
  action text not null,                     -- 'submitted' | 'approved' | 'rejected' | 'updated'
  performed_by text not null,
  performed_by_role text default 'admin',   -- 'admin' | 'sub_admin' | 'developer'
  reason text,
  created_at timestamptz default now()
);

-- ============================================================
-- 2. হাজী নিবন্ধন ও কাফেলা গ্রুপ (HAJI REGISTRATION & GROUPS)
-- ============================================================
create table if not exists public.inquiries (
  id text primary key,
  registration_ref text,
  haji_user_id text,
  haji_password text,
  name text,
  name_bn text,
  name_en text,
  phone text,
  email text,
  service_id text,
  service_name text,
  travelers text,
  total_haj_partner text,
  haj_partner_id_link text,
  partner_details text,
  nid_no text,
  passport_no text,
  date_of_birth text,
  guardian_phone text,
  father_name_bn text,
  father_name_en text,
  mother_name_bn text,
  mother_name_en text,
  present_address text,
  present_post_code text,
  permanent_address text,
  permanent_post_code text,
  room_preference text,
  selected_group text,
  payment_date text,
  paid_amount numeric(12,2) default 0,
  due_amount numeric(12,2) default 0,
  payment_receipt_url text,
  payment_receipt_name text,
  payment_method text,
  registration_type text default 'general',
  photo_url text,
  signature_url text,
  nid_doc_url text,
  passport_doc_url text,
  package_base_price numeric(12,2) default 0,
  room_price numeric(12,2) default 0,
  airfare_option text,
  airfare_price numeric(12,2) default 0,
  incidental_items jsonb default '[]'::jsonb,
  incidental_price numeric(12,2) default 0,
  per_person_total numeric(12,2) default 0,
  travelers_count int default 1,
  subtotal_amount numeric(12,2) default 0,
  discount_percent numeric(5,2) default 0,
  discount_amount numeric(12,2) default 0,
  final_total_amount numeric(12,2) default 0,
  discount_note text,
  message text,
  date text,
  status text default 'pending',            -- 'pending' | 'approved' | 'contacted' | 'rejected'
  approved_at text,
  admin_notes text,
  raw_data jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.kafela_groups (
  id text primary key,
  name text not null,
  leader text default 'নির্ধারিত হয়নি',
  max_capacity int default 50,
  type text default 'both',
  category text default 'হজ্ব ও ওমরাহ',
  departure_date text,
  departure_month text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.haji_companions (
  id text primary key default gen_random_uuid()::text,
  lead_haji_id text not null,
  companion_haji_id text not null,
  relationship text,
  created_at timestamptz default now()
);

-- ============================================================
-- 3. সাব-এডমিন ব্যবস্থাপনা (SUB-ADMINS & PERMISSIONS)
-- ============================================================
create table if not exists public.sub_admins (
  id text primary key,
  name text not null,
  email text unique not null,
  phone text,
  password text not null,
  role text default 'sub_admin',            -- 'sub_admin' | 'moderator' | 'accountant'
  permissions jsonb default '["registrations", "pricing"]'::jsonb,
  status text default 'active',             -- 'active' | 'suspended'
  last_login timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 4. হজ ও ওমরাহ্ আয়-ব্যয় লেজার (HAJI & UMRAH FINANCE RECORDS)
-- ============================================================
create table if not exists public.haji_finance_records (
  id text primary key,
  inquiry_id text,
  registration_ref text,
  haji_type text default 'hajj',            -- 'hajj' | 'umrah'
  year_season text default '২০২৬',
  haji_name text not null,
  haji_name_bn text,
  phone text,
  email text,
  nid_no text,
  passport_no text,
  district text default 'বগুড়া',
  package_name text,
  package_price numeric(12,2) default 0,
  discount_amount numeric(12,2) default 0,
  final_total_amount numeric(12,2) default 0,
  total_deposited numeric(12,2) default 0,
  due_amount numeric(12,2) default 0,
  payment_status text default 'due',        -- 'paid' | 'partial' | 'due'
  payments jsonb default '[]'::jsonb,
  expenses jsonb default '[]'::jsonb,
  total_expense numeric(12,2) default 0,
  net_profit numeric(12,2) default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.pilgrim_payments (
  id text primary key,
  finance_record_id text not null,
  haji_id text,
  haji_name text,
  amount numeric(12,2) not null default 0,
  payment_date text,
  method text default 'bank',               -- 'bank' | 'cash' | 'bkash' | 'nagad' | 'check' | 'other'
  voucher_no text,
  received_by text default 'মুত্তাকী ক্যাশিয়ার',
  note text,
  created_at timestamptz default now()
);

create table if not exists public.pilgrim_expense_items (
  id text primary key,
  finance_record_id text not null,
  haji_id text,
  category text not null,                   -- 'ticket' | 'hotel_makkah' | 'hotel_madinah' | 'visa_insurance' | 'moallem_fee' | 'transport' | 'food_catering' | 'guide_service' | 'misc'
  title text not null,
  amount numeric(12,2) not null default 0,
  note text,
  created_at timestamptz default now()
);

-- ============================================================
-- 5. অন্যান্য আয় ও পরিচালন ব্যয়ের হিসাব (OTHER INCOMES & OPERATING EXPENSES)
-- ============================================================
create table if not exists public.office_expenses (
  id text primary key,
  title text not null,
  entry_type text default 'expense',        -- 'expense' (ব্যয়) | 'income' (আয়)
  category text not null,                   -- rent, salary, utility, marketing, stationery, legal_license, consultancy_fee, service_charge, commission, donation_sponsor, other
  amount numeric(12,2) not null default 0,
  date text,
  expense_type text default 'general',      -- 'general' | 'hajj_overhead' | 'umrah_overhead'
  year_season text default '২০২৬',
  paid_by text,
  voucher_no text,
  note text,
  receipt_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 6. মূল্য নির্ধারণ (প্যাকেজ, রুম, বিমান, খরচ) (PRICING CONFIGURATION)
-- ============================================================
create table if not exists public.pricing_config (
  id text primary key default 'current',
  packages jsonb default '[]'::jsonb,
  rooms jsonb default '[]'::jsonb,
  airfares jsonb default '[]'::jsonb,
  incidentals jsonb default '[]'::jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.packages_pricing (
  id text primary key,
  title text not null,
  duration text,
  price numeric(12,2) not null default 0,
  category text default 'package',
  description text,
  features jsonb default '[]'::jsonb,
  is_featured boolean default false,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.rooms_pricing (
  id text primary key,
  title text not null,
  room_type text,                           -- 'quad' | 'triple' | 'double' | 'vip'
  price numeric(12,2) not null default 0,
  hotel_name text,
  distance_haram text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.airfares_pricing (
  id text primary key,
  airline_name text not null,
  flight_type text,                         -- 'direct' | 'transit'
  price numeric(12,2) not null default 0,
  route text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.incidentals_pricing (
  id text primary key,
  item_name text not null,
  category text,
  price numeric(12,2) not null default 0,
  is_mandatory boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 7. সেবাসমূহ (SERVICES)
-- ============================================================
create table if not exists public.services (
  id text primary key,
  title text not null,
  description text,
  icon text,
  image_url text,
  features jsonb default '[]'::jsonb,
  sort_order int default 0,
  is_active boolean default true,
  data jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 8. গ্যালারি ও ফটো/ভিডিও (GALLERY)
-- ============================================================
create table if not exists public.gallery (
  id text primary key,
  title text,
  image_url text,
  video_url text,
  media_type text default 'image',          -- 'image' | 'video' | 'audio'
  category text default 'hajj',
  caption text,
  sort_order int default 0,
  is_active boolean default true,
  data jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 9. পরিচালনা পর্ষদ ও মোয়াল্লিম টিম (BOARD OF DIRECTORS / TEAM)
-- ============================================================
create table if not exists public.team (
  id text primary key,
  name text not null,
  role text,
  designation text,
  phone text,
  email text,
  photo_url text,
  bio text,
  sort_order int default 0,
  is_active boolean default true,
  data jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 10. মতামত ও রিভিউ (REVIEWS & TESTIMONIALS)
-- ============================================================
create table if not exists public.reviews (
  id text primary key,
  name text not null,
  location text,
  package_taken text,
  rating numeric(3,1) default 5.0,
  comment text,
  date text,
  avatar_url text,
  is_approved boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- 11. নামাজের সময়সূচি (PRAYER SCHEDULE)
-- ============================================================
create table if not exists public.prayer_schedule (
  id text primary key default 'current',
  fajr text default '05:00 AM',
  sunrise text default '06:15 AM',
  dhuhr text default '12:05 PM',
  asr text default '03:45 PM',
  maghrib text default '05:35 PM',
  isha text default '07:00 PM',
  jummah text default '01:15 PM',
  updated_at timestamptz default now()
);

-- ============================================================
-- 12. পরিসংখ্যান (STATISTICS & KEY METRICS)
-- ============================================================
create table if not exists public.stats_metrics (
  id text primary key default 'current',
  total_hajis_served int default 1250,
  hajj_success_rate numeric(5,2) default 100.0,
  years_of_experience int default 12,
  partner_agencies int default 25,
  active_guides int default 18,
  data jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- ============================================================
-- 13. সাধারণ সেটিংস ও প্রতিষ্ঠান তথ্য (COMPANY INFO & SITE SETTINGS)
-- ============================================================
create table if not exists public.company_info (
  id text primary key default 'current',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.contact_messages (
  id text primary key,
  name text,
  email text,
  phone text,
  subject text,
  message text,
  date text,
  status text default 'pending',
  created_at timestamptz default now()
);

create table if not exists public.app_storage (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- ============================================================
-- 14. ফটো, ভিডিও, অডিও ও ফাইল লাইব্রেরি (MEDIA STORAGE METADATA)
-- ============================================================
create table if not exists public.media_library (
  id text primary key default gen_random_uuid()::text,
  bucket_id text not null,                  -- 'media-assets' | 'audio-video' | 'haji-documents'
  file_path text not null,
  file_name text not null,
  file_url text not null,
  media_type text not null,                 -- 'image' | 'video' | 'audio' | 'document'
  file_size bigint default 0,
  mime_type text,
  uploaded_by text default 'admin',
  created_at timestamptz default now()
);

-- ============================================================
-- 15. ডাইনামিক ভিউসমূহ (VIEWS: সার্বিক ব্যালেন্স শিট, মূল হজ, ওমরাহ্)
-- ============================================================

-- ক. অনুমোদন কেন্দ্র ভিউ (Pending Approvals View)
create or replace view public.vw_pending_approvals as
select
  i.id,
  i.registration_ref,
  i.haji_user_id,
  coalesce(i.name_bn, i.name) as haji_name,
  i.phone,
  i.service_name as package_name,
  i.selected_group,
  i.paid_amount,
  i.due_amount,
  i.photo_url,
  i.payment_receipt_url,
  i.date as applied_date,
  i.status
from public.inquiries i
where i.status = 'pending' or i.status is null;

-- খ. মূল হজ লেজার ভিউ (Main Hajj Ledger View)
create or replace view public.vw_main_hajj_ledger as
select
  id,
  registration_ref,
  haji_name,
  phone,
  package_name,
  package_price,
  discount_amount,
  final_total_amount as contract_amount,
  total_deposited,
  due_amount,
  total_expense,
  net_profit,
  payment_status,
  year_season
from public.haji_finance_records
where haji_type = 'hajj';

-- গ. ওমরাহ্ লেজার ভিউ (Umrah Ledger View)
create or replace view public.vw_umrah_ledger as
select
  id,
  registration_ref,
  haji_name,
  phone,
  package_name,
  package_price,
  discount_amount,
  final_total_amount as contract_amount,
  total_deposited,
  due_amount,
  total_expense,
  net_profit,
  payment_status,
  year_season
from public.haji_finance_records
where haji_type = 'umrah';

-- ঘ. অন্যান্য আয় ও ব্যয়ের হিসাব ভিউ (Other Incomes & Expenses View)
create or replace view public.vw_other_incomes_expenses as
select
  id,
  title,
  entry_type,
  category,
  amount,
  date,
  expense_type,
  paid_by,
  voucher_no,
  note
from public.office_expenses;

-- ঙ. সার্বিক ব্যালেন্স শিট ভিউ (Overall Balance Sheet View)
create or replace view public.vw_overall_balance_sheet as
select
  coalesce(sum(case when r.haji_type = 'hajj' then r.total_deposited else 0 end), 0) as hajj_total_deposited,
  coalesce(sum(case when r.haji_type = 'umrah' then r.total_deposited else 0 end), 0) as umrah_total_deposited,
  coalesce(sum(r.total_deposited), 0) as total_pilgrim_deposits,
  coalesce((select sum(amount) from public.office_expenses where entry_type = 'income'), 0) as total_other_income,
  coalesce(sum(r.total_deposited), 0) + coalesce((select sum(amount) from public.office_expenses where entry_type = 'income'), 0) as grand_total_income,
  coalesce(sum(case when r.haji_type = 'hajj' then r.total_expense else 0 end), 0) as hajj_total_expense,
  coalesce(sum(case when r.haji_type = 'umrah' then r.total_expense else 0 end), 0) as umrah_total_expense,
  coalesce((select sum(amount) from public.office_expenses where entry_type != 'income'), 0) as total_other_expense,
  coalesce(sum(r.total_expense), 0) + coalesce((select sum(amount) from public.office_expenses where entry_type != 'income'), 0) as grand_total_expenses,
  (coalesce(sum(r.total_deposited), 0) + coalesce((select sum(amount) from public.office_expenses where entry_type = 'income'), 0)) -
  (coalesce(sum(r.total_expense), 0) + coalesce((select sum(amount) from public.office_expenses where entry_type != 'income'), 0)) as grand_net_profit
from public.haji_finance_records r;

-- ============================================================
-- 16. SUPABASE STORAGE BUCKETS (ফটো, ভিডিও, অডিও ও ডকুমেন্টস)
-- ============================================================
insert into storage.buckets (id, name, public)
values
  ('media-assets', 'media-assets', true),
  ('audio-video', 'audio-video', true),
  ('haji-documents', 'haji-documents', true)
on conflict (id) do update set public = true;

-- Storage Policies for media-assets (ফটো, ব্যানার, লোগো)
drop policy if exists "media_assets_public_read" on storage.objects;
create policy "media_assets_public_read" on storage.objects for select to public using (bucket_id = 'media-assets');

drop policy if exists "media_assets_anon_insert" on storage.objects;
create policy "media_assets_anon_insert" on storage.objects for insert to anon with check (bucket_id = 'media-assets');

drop policy if exists "media_assets_anon_update" on storage.objects;
create policy "media_assets_anon_update" on storage.objects for update to anon using (bucket_id = 'media-assets');

drop policy if exists "media_assets_anon_delete" on storage.objects;
create policy "media_assets_anon_delete" on storage.objects for delete to anon using (bucket_id = 'media-assets');

-- Storage Policies for audio-video (ভিডিও ক্লিপ ও অডিও)
drop policy if exists "audio_video_public_read" on storage.objects;
create policy "audio_video_public_read" on storage.objects for select to public using (bucket_id = 'audio-video');

drop policy if exists "audio_video_anon_insert" on storage.objects;
create policy "audio_video_anon_insert" on storage.objects for insert to anon with check (bucket_id = 'audio-video');

drop policy if exists "audio_video_anon_update" on storage.objects;
create policy "audio_video_anon_update" on storage.objects for update to anon using (bucket_id = 'audio-video');

drop policy if exists "audio_video_anon_delete" on storage.objects;
create policy "audio_video_anon_delete" on storage.objects for delete to anon using (bucket_id = 'audio-video');

-- Storage Policies for haji-documents (হাজীদের পাসপোর্ট, এনআইডি, ছবি, স্লিপ)
drop policy if exists "haji_documents_public_read" on storage.objects;
create policy "haji_documents_public_read" on storage.objects for select to public using (bucket_id = 'haji-documents');

drop policy if exists "haji_documents_anon_insert" on storage.objects;
create policy "haji_documents_anon_insert" on storage.objects for insert to anon with check (bucket_id = 'haji-documents');

drop policy if exists "haji_documents_anon_update" on storage.objects;
create policy "haji_documents_anon_update" on storage.objects for update to anon using (bucket_id = 'haji-documents');

drop policy if exists "haji_documents_anon_delete" on storage.objects;
create policy "haji_documents_anon_delete" on storage.objects for delete to anon using (bucket_id = 'haji-documents');

-- ============================================================
-- 17. ROW LEVEL SECURITY (RLS) POLICIES FOR ALL TABLES
-- ============================================================
alter table public.approvals enable row level security;
alter table public.approval_logs enable row level security;
alter table public.inquiries enable row level security;
alter table public.kafela_groups enable row level security;
alter table public.haji_companions enable row level security;
alter table public.sub_admins enable row level security;
alter table public.haji_finance_records enable row level security;
alter table public.pilgrim_payments enable row level security;
alter table public.pilgrim_expense_items enable row level security;
alter table public.office_expenses enable row level security;
alter table public.pricing_config enable row level security;
alter table public.packages_pricing enable row level security;
alter table public.rooms_pricing enable row level security;
alter table public.airfares_pricing enable row level security;
alter table public.incidentals_pricing enable row level security;
alter table public.services enable row level security;
alter table public.gallery enable row level security;
alter table public.team enable row level security;
alter table public.reviews enable row level security;
alter table public.prayer_schedule enable row level security;
alter table public.stats_metrics enable row level security;
alter table public.company_info enable row level security;
alter table public.site_settings enable row level security;
alter table public.contact_messages enable row level security;
alter table public.app_storage enable row level security;
alter table public.media_library enable row level security;

-- Policies for public / anon access
drop policy if exists "anon_all_approvals" on public.approvals;
create policy "anon_all_approvals" on public.approvals for all to anon using (true) with check (true);

drop policy if exists "anon_all_approval_logs" on public.approval_logs;
create policy "anon_all_approval_logs" on public.approval_logs for all to anon using (true) with check (true);

drop policy if exists "anon_all_inquiries" on public.inquiries;
create policy "anon_all_inquiries" on public.inquiries for all to anon using (true) with check (true);

drop policy if exists "anon_all_kafela_groups" on public.kafela_groups;
create policy "anon_all_kafela_groups" on public.kafela_groups for all to anon using (true) with check (true);

drop policy if exists "anon_all_haji_companions" on public.haji_companions;
create policy "anon_all_haji_companions" on public.haji_companions for all to anon using (true) with check (true);

drop policy if exists "anon_all_sub_admins" on public.sub_admins;
create policy "anon_all_sub_admins" on public.sub_admins for all to anon using (true) with check (true);

drop policy if exists "anon_all_haji_finance" on public.haji_finance_records;
create policy "anon_all_haji_finance" on public.haji_finance_records for all to anon using (true) with check (true);

drop policy if exists "anon_all_pilgrim_payments" on public.pilgrim_payments;
create policy "anon_all_pilgrim_payments" on public.pilgrim_payments for all to anon using (true) with check (true);

drop policy if exists "anon_all_pilgrim_expenses" on public.pilgrim_expense_items;
create policy "anon_all_pilgrim_expenses" on public.pilgrim_expense_items for all to anon using (true) with check (true);

drop policy if exists "anon_all_office_expenses" on public.office_expenses;
create policy "anon_all_office_expenses" on public.office_expenses for all to anon using (true) with check (true);

drop policy if exists "anon_all_pricing_config" on public.pricing_config;
create policy "anon_all_pricing_config" on public.pricing_config for all to anon using (true) with check (true);

drop policy if exists "anon_all_packages_pricing" on public.packages_pricing;
create policy "anon_all_packages_pricing" on public.packages_pricing for all to anon using (true) with check (true);

drop policy if exists "anon_all_rooms_pricing" on public.rooms_pricing;
create policy "anon_all_rooms_pricing" on public.rooms_pricing for all to anon using (true) with check (true);

drop policy if exists "anon_all_airfares_pricing" on public.airfares_pricing;
create policy "anon_all_airfares_pricing" on public.airfares_pricing for all to anon using (true) with check (true);

drop policy if exists "anon_all_incidentals_pricing" on public.incidentals_pricing;
create policy "anon_all_incidentals_pricing" on public.incidentals_pricing for all to anon using (true) with check (true);

drop policy if exists "anon_all_services" on public.services;
create policy "anon_all_services" on public.services for all to anon using (true) with check (true);

drop policy if exists "anon_all_gallery" on public.gallery;
create policy "anon_all_gallery" on public.gallery for all to anon using (true) with check (true);

drop policy if exists "anon_all_team" on public.team;
create policy "anon_all_team" on public.team for all to anon using (true) with check (true);

drop policy if exists "anon_all_reviews" on public.reviews;
create policy "anon_all_reviews" on public.reviews for all to anon using (true) with check (true);

drop policy if exists "anon_all_prayer_schedule" on public.prayer_schedule;
create policy "anon_all_prayer_schedule" on public.prayer_schedule for all to anon using (true) with check (true);

drop policy if exists "anon_all_stats_metrics" on public.stats_metrics;
create policy "anon_all_stats_metrics" on public.stats_metrics for all to anon using (true) with check (true);

drop policy if exists "anon_all_company_info" on public.company_info;
create policy "anon_all_company_info" on public.company_info for all to anon using (true) with check (true);

drop policy if exists "anon_all_site_settings" on public.site_settings;
create policy "anon_all_site_settings" on public.site_settings for all to anon using (true) with check (true);

drop policy if exists "anon_all_contact_messages" on public.contact_messages;
create policy "anon_all_contact_messages" on public.contact_messages for all to anon using (true) with check (true);

drop policy if exists "anon_all_app_storage" on public.app_storage;
create policy "anon_all_app_storage" on public.app_storage for all to anon using (true) with check (true);

drop policy if exists "anon_all_media_library" on public.media_library;
create policy "anon_all_media_library" on public.media_library for all to anon using (true) with check (true);

-- Policies for authenticated users
drop policy if exists "auth_all_approvals" on public.approvals;
create policy "auth_all_approvals" on public.approvals for all to authenticated using (true) with check (true);

drop policy if exists "auth_all_inquiries" on public.inquiries;
create policy "auth_all_inquiries" on public.inquiries for all to authenticated using (true) with check (true);

drop policy if exists "auth_all_sub_admins" on public.sub_admins;
create policy "auth_all_sub_admins" on public.sub_admins for all to authenticated using (true) with check (true);

drop policy if exists "auth_all_haji_finance" on public.haji_finance_records;
create policy "auth_all_haji_finance" on public.haji_finance_records for all to authenticated using (true) with check (true);

drop policy if exists "auth_all_office_expenses" on public.office_expenses;
create policy "auth_all_office_expenses" on public.office_expenses for all to authenticated using (true) with check (true);

drop policy if exists "auth_all_pricing_config" on public.pricing_config;
create policy "auth_all_pricing_config" on public.pricing_config for all to authenticated using (true) with check (true);

drop policy if exists "auth_all_services" on public.services;
create policy "auth_all_services" on public.services for all to authenticated using (true) with check (true);

drop policy if exists "auth_all_gallery" on public.gallery;
create policy "auth_all_gallery" on public.gallery for all to authenticated using (true) with check (true);

drop policy if exists "auth_all_team" on public.team;
create policy "auth_all_team" on public.team for all to authenticated using (true) with check (true);

drop policy if exists "auth_all_reviews" on public.reviews;
create policy "auth_all_reviews" on public.reviews for all to authenticated using (true) with check (true);

drop policy if exists "auth_all_company_info" on public.company_info;
create policy "auth_all_company_info" on public.company_info for all to authenticated using (true) with check (true);

drop policy if exists "auth_all_app_storage" on public.app_storage;
create policy "auth_all_app_storage" on public.app_storage for all to authenticated using (true) with check (true);

drop policy if exists "auth_all_media_library" on public.media_library;
create policy "auth_all_media_library" on public.media_library for all to authenticated using (true) with check (true);
