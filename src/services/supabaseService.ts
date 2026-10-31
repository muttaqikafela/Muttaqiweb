import { supabase, isSupabaseConfigured, SUPABASE_PROJECT_ID, SUPABASE_URL } from '../lib/supabase';
import {
  InquiryItem,
  ContactMessage,
  ReviewItem,
  CompanyInfo,
  KafelaPricingConfig,
  ServiceItem,
  TeamMember,
  GalleryItem,
  HajiFinanceRecord,
  OfficeExpense
} from '../types';

export const SUPABASE_SQL_SCHEMA = `-- ============================================================
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

create extension if not exists pgcrypto;

-- 1. অনুমোদন কেন্দ্র ও আবেদন ট্র্যাকিং (APPROVALS & AUDIT LOGS)
create table if not exists public.approvals (
  id text primary key default gen_random_uuid()::text,
  inquiry_id text not null,
  haji_user_id text,
  haji_name text not null,
  haji_phone text,
  request_type text default 'registration',
  status text not null default 'pending',
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
  action text not null,
  performed_by text not null,
  performed_by_role text default 'admin',
  reason text,
  created_at timestamptz default now()
);

-- 2. হাজী নিবন্ধন ও কাফেলা গ্রুপ (HAJI REGISTRATION & GROUPS)
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
  status text default 'pending',
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

-- 3. সাব-এডমিন ব্যবস্থাপনা (SUB-ADMINS & PERMISSIONS)
create table if not exists public.sub_admins (
  id text primary key,
  name text not null,
  email text unique not null,
  phone text,
  password text not null,
  role text default 'sub_admin',
  permissions jsonb default '["registrations", "pricing"]'::jsonb,
  status text default 'active',
  last_login timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. হজ ও ওমরাহ্ আয়-ব্যয় লেজার (HAJI & UMRAH FINANCE RECORDS)
create table if not exists public.haji_finance_records (
  id text primary key,
  inquiry_id text,
  registration_ref text,
  haji_type text default 'hajj',
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
  payment_status text default 'due',
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
  method text default 'bank',
  voucher_no text,
  received_by text default 'মুত্তাকী ক্যাশিয়ার',
  note text,
  created_at timestamptz default now()
);

create table if not exists public.pilgrim_expense_items (
  id text primary key,
  finance_record_id text not null,
  haji_id text,
  category text not null,
  title text not null,
  amount numeric(12,2) not null default 0,
  note text,
  created_at timestamptz default now()
);

-- 5. অন্যান্য আয় ও পরিচালন ব্যয়ের হিসাব (OTHER INCOMES & OPERATING EXPENSES)
create table if not exists public.office_expenses (
  id text primary key,
  title text not null,
  entry_type text default 'expense',
  category text not null,
  amount numeric(12,2) not null default 0,
  date text,
  expense_type text default 'general',
  year_season text default '২০২৬',
  paid_by text,
  voucher_no text,
  note text,
  receipt_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. মূল্য নির্ধারণ (প্যাকেজ, রুম, বিমান, খরচ) (PRICING CONFIGURATION)
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
  room_type text,
  price numeric(12,2) not null default 0,
  hotel_name text,
  distance_haram text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.airfares_pricing (
  id text primary key,
  airline_name text not null,
  flight_type text,
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

-- 7. সেবাসমূহ (SERVICES)
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

-- 8. গ্যালারি ও ফটো/ভিডিও (GALLERY)
create table if not exists public.gallery (
  id text primary key,
  title text,
  image_url text,
  video_url text,
  media_type text default 'image',
  category text default 'hajj',
  caption text,
  sort_order int default 0,
  is_active boolean default true,
  data jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 9. পরিচালনা পর্ষদ ও মোয়াল্লিম টিম (BOARD OF DIRECTORS / TEAM)
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

-- 10. মতামত ও রিভিউ (REVIEWS & TESTIMONIALS)
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

-- 11. নামাজের সময়সূচি (PRAYER SCHEDULE)
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

-- 12. পরিসংখ্যান (STATISTICS & KEY METRICS)
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

-- 13. সাধারণ সেটিংস ও প্রতিষ্ঠান তথ্য (COMPANY INFO & SITE SETTINGS)
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

-- 14. নোটিশ বোর্ড ও ফটো বিজ্ঞপ্তি (NOTICE BOARD & PHOTO ANNOUNCEMENTS)
create table if not exists public.notices (
  id text primary key,
  title text not null,
  content text not null,
  image_url text,
  category text not null default 'general',
  date text not null,
  is_pinned boolean default false,
  is_active boolean default true,
  published_by text,
  published_role text default 'admin',
  created_at timestamptz default now(),
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

-- 14. ফটো, ভিডিও, অডিও ও ফাইল লাইব্রেরি (MEDIA STORAGE METADATA)
create table if not exists public.media_library (
  id text primary key default gen_random_uuid()::text,
  bucket_id text not null,
  file_path text not null,
  file_name text not null,
  file_url text not null,
  media_type text not null,
  file_size bigint default 0,
  mime_type text,
  uploaded_by text default 'admin',
  created_at timestamptz default now()
);

-- 15. ডাইনামিক ভিউসমূহ (VIEWS: সার্বিক ব্যালেন্স শিট, মূল হজ, ওমরাহ্)
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

-- 16. SUPABASE STORAGE BUCKETS (ফটো, ভিডিও, অডিও ও ডকুমেন্টস)
insert into storage.buckets (id, name, public)
values
  ('media-assets', 'media-assets', true),
  ('audio-video', 'audio-video', true),
  ('haji-documents', 'haji-documents', true)
on conflict (id) do update set public = true;

drop policy if exists "media_assets_public_read" on storage.objects;
create policy "media_assets_public_read" on storage.objects for select to public using (bucket_id = 'media-assets');

drop policy if exists "media_assets_anon_insert" on storage.objects;
create policy "media_assets_anon_insert" on storage.objects for insert to anon with check (bucket_id = 'media-assets');

drop policy if exists "media_assets_anon_update" on storage.objects;
create policy "media_assets_anon_update" on storage.objects for update to anon using (bucket_id = 'media-assets');

drop policy if exists "media_assets_anon_delete" on storage.objects;
create policy "media_assets_anon_delete" on storage.objects for delete to anon using (bucket_id = 'media-assets');

drop policy if exists "audio_video_public_read" on storage.objects;
create policy "audio_video_public_read" on storage.objects for select to public using (bucket_id = 'audio-video');

drop policy if exists "audio_video_anon_insert" on storage.objects;
create policy "audio_video_anon_insert" on storage.objects for insert to anon with check (bucket_id = 'audio-video');

drop policy if exists "audio_video_anon_update" on storage.objects;
create policy "audio_video_anon_update" on storage.objects for update to anon using (bucket_id = 'audio-video');

drop policy if exists "audio_video_anon_delete" on storage.objects;
create policy "audio_video_anon_delete" on storage.objects for delete to anon using (bucket_id = 'audio-video');

drop policy if exists "haji_documents_public_read" on storage.objects;
create policy "haji_documents_public_read" on storage.objects for select to public using (bucket_id = 'haji-documents');

drop policy if exists "haji_documents_anon_insert" on storage.objects;
create policy "haji_documents_anon_insert" on storage.objects for insert to anon with check (bucket_id = 'haji-documents');

drop policy if exists "haji_documents_anon_update" on storage.objects;
create policy "haji_documents_anon_update" on storage.objects for update to anon using (bucket_id = 'haji-documents');

drop policy if exists "haji_documents_anon_delete" on storage.objects;
create policy "haji_documents_anon_delete" on storage.objects for delete to anon using (bucket_id = 'haji-documents');

-- 17. ROW LEVEL SECURITY (RLS) POLICIES FOR ALL TABLES
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

drop policy if exists "anon_all_notices" on public.notices;
create policy "anon_all_notices" on public.notices for all to anon using (true) with check (true);

drop policy if exists "anon_all_app_storage" on public.app_storage;
create policy "anon_all_app_storage" on public.app_storage for all to anon using (true) with check (true);

drop policy if exists "anon_all_media_library" on public.media_library;
create policy "anon_all_media_library" on public.media_library for all to anon using (true) with check (true);
`;

export interface SupabaseSyncStatus {
  isConnected: boolean;
  isTablesReady: boolean;
  lastSyncTime: string | null;
  pendingSyncCount: number;
  errorMessage: string | null;
}

// Convert InquiryItem camelCase to Supabase snake_case
const inquiryToDb = (item: InquiryItem) => ({
  id: item.id,
  registration_ref: item.registrationRef || null,
  haji_user_id: item.hajiUserId || null,
  haji_password: item.hajiPassword || null,
  name: item.name || '',
  name_bn: item.nameBn || null,
  name_en: item.nameEn || null,
  phone: item.phone || '',
  email: item.email || null,
  service_id: item.serviceId || null,
  service_name: item.serviceName || null,
  travelers: item.travelers || null,
  total_haj_partner: item.totalHajPartner || null,
  haj_partner_id_link: item.hajPartnerIdLink || null,
  partner_details: item.partnerDetails || null,
  nid_no: item.nidNo || null,
  passport_no: item.passportNo || null,
  date_of_birth: item.dateOfBirth || null,
  guardian_phone: item.guardianPhone || null,
  father_name_bn: item.fatherNameBn || null,
  father_name_en: item.fatherNameEn || null,
  mother_name_bn: item.motherNameBn || null,
  mother_name_en: item.motherNameEn || null,
  present_address: item.presentAddress || null,
  present_post_code: item.presentPostCode || null,
  permanent_address: item.permanentAddress || null,
  permanent_post_code: item.permanentPostCode || null,
  room_preference: item.roomPreference || null,
  selected_group: item.selectedGroup || null,
  payment_date: item.paymentDate || null,
  paid_amount: item.paidAmount ?? null,
  due_amount: item.dueAmount ?? null,
  payment_receipt_url: item.paymentReceiptUrl || null,
  payment_receipt_name: item.paymentReceiptName || null,
  payment_method: item.paymentMethod || null,
  registration_type: item.registrationType || 'general',
  photo_url: item.photoUrl || null,
  signature_url: item.signatureUrl || null,
  nid_doc_url: item.nidDocUrl || null,
  passport_doc_url: item.passportDocUrl || null,
  package_base_price: item.packageBasePrice ?? null,
  room_price: item.roomPrice ?? null,
  airfare_option: item.airfareOption || null,
  airfare_price: item.airfarePrice ?? null,
  incidental_items: item.incidentalItems || [],
  incidental_price: item.incidentalPrice ?? null,
  per_person_total: item.perPersonTotal ?? null,
  travelers_count: item.travelersCount ?? null,
  subtotal_amount: item.subtotalAmount ?? null,
  discount_percent: item.discountPercent ?? null,
  discount_amount: item.discountAmount ?? null,
  final_total_amount: item.finalTotalAmount ?? null,
  discount_note: item.discountNote || null,
  message: item.message || '',
  date: item.date || new Date().toISOString().split('T')[0],
  status: item.status || 'pending',
  approved_at: item.approvedAt || null,
  admin_notes: item.adminNotes || null,
  raw_data: item,
  updated_at: new Date().toISOString()
});

// Convert Supabase row to InquiryItem
const dbToInquiry = (row: any): InquiryItem => {
  if (row.raw_data && typeof row.raw_data === 'object') {
    return {
      ...row.raw_data,
      id: row.id,
      status: row.status || row.raw_data.status || 'pending',
      adminNotes: row.admin_notes || row.raw_data.adminNotes,
      approvedAt: row.approved_at || row.raw_data.approvedAt,
      discountPercent: row.discount_percent ?? row.raw_data.discountPercent,
      discountAmount: row.discount_amount ?? row.raw_data.discountAmount,
      finalTotalAmount: row.final_total_amount ?? row.raw_data.finalTotalAmount,
      paidAmount: row.paid_amount != null ? Number(row.paid_amount) : row.raw_data.paidAmount,
      dueAmount: row.due_amount != null ? Number(row.due_amount) : row.raw_data.dueAmount,
      paymentDate: row.payment_date || row.raw_data.paymentDate,
      paymentReceiptUrl: row.payment_receipt_url || row.raw_data.paymentReceiptUrl,
      paymentReceiptName: row.payment_receipt_name || row.raw_data.paymentReceiptName,
      paymentMethod: row.payment_method || row.raw_data.paymentMethod
    };
  }

  return {
    id: row.id,
    registrationRef: row.registration_ref,
    hajiUserId: row.haji_user_id,
    hajiPassword: row.haji_password,
    name: row.name,
    nameBn: row.name_bn,
    nameEn: row.name_en,
    phone: row.phone,
    email: row.email,
    serviceId: row.service_id,
    serviceName: row.service_name,
    travelers: row.travelers,
    totalHajPartner: row.total_haj_partner,
    hajPartnerIdLink: row.haj_partner_id_link,
    partnerDetails: row.partner_details,
    nidNo: row.nid_no,
    passportNo: row.passport_no,
    dateOfBirth: row.date_of_birth,
    guardianPhone: row.guardian_phone,
    fatherNameBn: row.father_name_bn,
    fatherNameEn: row.father_name_en,
    motherNameBn: row.mother_name_bn,
    motherNameEn: row.mother_name_en,
    presentAddress: row.present_address,
    presentPostCode: row.present_post_code,
    permanentAddress: row.permanent_address,
    permanentPostCode: row.permanent_post_code,
    roomPreference: row.room_preference,
    selectedGroup: row.selected_group || row.raw_data?.selectedGroup,
    paymentDate: row.payment_date,
    paidAmount: row.paid_amount != null ? Number(row.paid_amount) : undefined,
    dueAmount: row.due_amount != null ? Number(row.due_amount) : undefined,
    paymentReceiptUrl: row.payment_receipt_url,
    paymentReceiptName: row.payment_receipt_name,
    paymentMethod: row.payment_method,
    registrationType: row.registration_type,
    photoUrl: row.photo_url,
    signatureUrl: row.signature_url,
    nidDocUrl: row.nid_doc_url,
    passportDocUrl: row.passport_doc_url,
    packageBasePrice: row.package_base_price ? Number(row.package_base_price) : undefined,
    roomPrice: row.room_price ? Number(row.room_price) : undefined,
    airfareOption: row.airfare_option,
    airfarePrice: row.airfare_price ? Number(row.airfare_price) : undefined,
    incidentalItems: row.incidental_items || [],
    incidentalPrice: row.incidental_price ? Number(row.incidental_price) : undefined,
    perPersonTotal: row.per_person_total ? Number(row.per_person_total) : undefined,
    travelersCount: row.travelers_count ? Number(row.travelers_count) : undefined,
    subtotalAmount: row.subtotal_amount ? Number(row.subtotal_amount) : undefined,
    discountPercent: row.discount_percent ? Number(row.discount_percent) : undefined,
    discountAmount: row.discount_amount ? Number(row.discount_amount) : undefined,
    finalTotalAmount: row.final_total_amount ? Number(row.final_total_amount) : undefined,
    discountNote: row.discount_note,
    message: row.message,
    date: row.date,
    status: row.status,
    approvedAt: row.approved_at,
    adminNotes: row.admin_notes
  };
};

export const SupabaseService = {
  getProjectId: () => SUPABASE_PROJECT_ID,
  getUrl: () => SUPABASE_URL,
  isConfigured: () => isSupabaseConfigured,

  // Test Supabase Connection & Table Availability
  async checkConnection(): Promise<{
    connected: boolean;
    tablesReady: boolean;
    message: string;
  }> {
    try {
      // Test querying the inquiries table
      const { error: inqError } = await supabase.from('inquiries').select('id').limit(1);

      if (!inqError) {
        return {
          connected: true,
          tablesReady: true,
          message: 'সংযোগ সফল এবং টেবিলসমূহ সক্রিয় রয়েছে।'
        };
      }

      // Check if table missing error (PGRST205 or PGRST204)
      if (inqError.code === 'PGRST205' || inqError.message?.includes('Could not find the table')) {
        // Also test app_storage
        const { error: storageError } = await supabase.from('app_storage').select('key').limit(1);
        if (!storageError) {
          return {
            connected: true,
            tablesReady: true,
            message: 'সংযোগ সফল।'
          };
        }

        return {
          connected: true,
          tablesReady: false,
          message: 'সংযোগ আছে, কিন্তু টেবিল তৈরি করা প্রয়োজন।'
        };
      }

      return {
        connected: false,
        tablesReady: false,
        message: inqError.message || 'সংযোগ করতে সমস্যা হচ্ছে।'
      };
    } catch (err: any) {
      return {
        connected: false,
        tablesReady: false,
        message: err?.message || 'নেটওয়ার্ক ত্রুটি।'
      };
    }
  },

  // Save an inquiry or Haji registration to Supabase
  async saveInquiry(inquiry: InquiryItem): Promise<boolean> {
    try {
      const payload = inquiryToDb(inquiry);
      const { error } = await supabase
        .from('inquiries')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        // Fallback to app_storage if inquiries table doesn't exist
        if (error.code === 'PGRST205' || error.message?.includes('Could not find')) {
          await this.saveAppStorageItem('inquiries_backup', inquiry);
        } else {
          console.warn('Supabase inquiries upsert error:', error);
        }
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase saveInquiry exception:', err);
      return false;
    }
  },

  // Delete an inquiry from Supabase
  async deleteInquiry(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('inquiries').delete().eq('id', id);
      if (error) {
        console.warn('Supabase deleteInquiry error:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase deleteInquiry exception:', err);
      return false;
    }
  },

  // Fetch all inquiries from Supabase
  async fetchInquiries(): Promise<InquiryItem[] | null> {
    try {
      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code !== 'PGRST205') {
          console.warn('Supabase fetchInquiries error:', error);
        }
        return null;
      }

      if (data && Array.isArray(data)) {
        return data.map(dbToInquiry);
      }
      return [];
    } catch (err) {
      console.warn('Supabase fetchInquiries exception:', err);
      return null;
    }
  },

  // Save Pricing Configuration to Supabase
  async savePricingConfig(config: KafelaPricingConfig): Promise<boolean> {
    try {
      const { error } = await supabase.from('pricing_config').upsert({
        id: 'current',
        packages: config.packages,
        rooms: config.rooms,
        airfares: config.airfares,
        incidentals: config.incidentals,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

      if (error) {
        if (error.code === 'PGRST205') {
          await this.saveAppStorageItem('pricing_config', config);
        } else {
          console.warn('Supabase savePricingConfig error:', error);
        }
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase savePricingConfig exception:', err);
      return false;
    }
  },

  // Fetch Pricing Configuration from Supabase
  async fetchPricingConfig(): Promise<KafelaPricingConfig | null> {
    try {
      const { data, error } = await supabase
        .from('pricing_config')
        .select('*')
        .eq('id', 'current')
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return {
        packages: data.packages || [],
        rooms: data.rooms || [],
        airfares: data.airfares || [],
        incidentals: data.incidentals || []
      };
    } catch (err) {
      console.warn('Supabase fetchPricingConfig exception:', err);
      return null;
    }
  },

  // Save Contact Message to Supabase
  async saveContactMessage(msg: ContactMessage): Promise<boolean> {
    try {
      const { error } = await supabase.from('contact_messages').upsert({
        id: msg.id,
        name: msg.name,
        email: msg.email || null,
        phone: msg.phone,
        subject: msg.subject,
        message: msg.message,
        date: msg.date,
        status: msg.status || 'pending',
        admin_notes: msg.adminNotes || null,
        created_at: new Date().toISOString()
      }, { onConflict: 'id' });

      if (error) {
        console.warn('Supabase saveContactMessage error:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase saveContactMessage exception:', err);
      return false;
    }
  },

  // Delete Contact Message from Supabase
  async deleteContactMessage(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('contact_messages').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  },

  // Fetch Contact Messages from Supabase
  async fetchContactMessages(): Promise<ContactMessage[] | null> {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) return null;

      return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        subject: row.subject,
        message: row.message,
        date: row.date,
        status: row.status,
        adminNotes: row.admin_notes
      }));
    } catch {
      return null;
    }
  },

  // Save Review to Supabase
  async saveReview(review: ReviewItem): Promise<boolean> {
    try {
      const { error } = await supabase.from('reviews').upsert({
        id: review.id,
        name: review.name,
        location: review.location,
        package_taken: review.packageTaken,
        rating: review.rating,
        comment: review.comment,
        date: review.date,
        is_approved: review.isApproved,
        created_at: new Date().toISOString()
      }, { onConflict: 'id' });

      return !error;
    } catch {
      return false;
    }
  },

  // Delete Review from Supabase
  async deleteReview(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  },

  // Fetch Reviews from Supabase
  async fetchReviews(): Promise<ReviewItem[] | null> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) return null;

      return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        location: row.location,
        packageTaken: row.package_taken,
        rating: Number(row.rating),
        comment: row.comment,
        date: row.date,
        isApproved: row.is_approved
      }));
    } catch {
      return null;
    }
  },

  // Save Company Info to Supabase
  async saveCompanyInfo(info: CompanyInfo): Promise<boolean> {
    try {
      const { error } = await supabase.from('company_info').upsert({
        id: 'current',
        data: info,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

      return !error;
    } catch {
      return false;
    }
  },

  // Fetch Company Info from Supabase
  async fetchCompanyInfo(): Promise<CompanyInfo | null> {
    try {
      const { data, error } = await supabase
        .from('company_info')
        .select('data')
        .eq('id', 'current')
        .maybeSingle();

      if (error || !data?.data) return null;
      return data.data as CompanyInfo;
    } catch {
      return null;
    }
  },

  // Generic app_storage helper
  async saveAppStorageItem(key: string, value: any): Promise<boolean> {
    try {
      const { error } = await supabase.from('app_storage').upsert({
        key,
        value,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });

      return !error;
    } catch {
      return false;
    }
  },

  async getAppStorageItem<T = any>(key: string): Promise<T | null> {
    try {
      const { data, error } = await supabase
        .from('app_storage')
        .select('value')
        .eq('key', key)
        .maybeSingle();

      if (error || !data) return null;
      return data.value as T;
    } catch {
      return null;
    }
  },

  // Save Haji Finance Record to Supabase
  async saveHajiFinanceRecord(record: HajiFinanceRecord): Promise<boolean> {
    try {
      const payload = {
        id: record.id,
        inquiry_id: record.inquiryId || null,
        registration_ref: record.registrationRef || null,
        haji_type: record.hajiType || 'hajj',
        year_season: record.yearSeason || '২০২৬',
        haji_name: record.hajiName,
        haji_name_bn: record.hajiNameBn || null,
        phone: record.phone || '',
        email: record.email || null,
        nid_no: record.nidNo || null,
        passport_no: record.passportNo || null,
        district: record.district || null,
        package_name: record.packageName || '',
        package_price: record.packagePrice ?? 0,
        discount_amount: record.discountAmount ?? 0,
        final_total_amount: record.finalTotalAmount ?? 0,
        total_deposited: record.totalDeposited ?? 0,
        due_amount: record.dueAmount ?? 0,
        payment_status: record.paymentStatus || 'due',
        payments: record.payments || [],
        expenses: record.expenses || [],
        total_expense: record.totalExpense ?? 0,
        net_profit: record.netProfit ?? 0,
        notes: record.notes || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('haji_finance_records')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        // Fallback to app_storage
        if (error.code === 'PGRST205' || error.message?.includes('Could not find')) {
          await this.saveAppStorageItem(`haji_fin_${record.id}`, record);
        } else {
          console.warn('Supabase saveHajiFinanceRecord error:', error);
        }
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase saveHajiFinanceRecord exception:', err);
      return false;
    }
  },

  // Delete Haji Finance Record from Supabase
  async deleteHajiFinanceRecord(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('haji_finance_records').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  },

  // Fetch Haji Finance Records from Supabase
  async fetchHajiFinanceRecords(): Promise<HajiFinanceRecord[] | null> {
    try {
      const { data, error } = await supabase
        .from('haji_finance_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) {
        // Try fallback app_storage
        const cached = await this.getAppStorageItem<HajiFinanceRecord[]>('all_haji_finance_records');
        if (cached && Array.isArray(cached)) return cached;
        return null;
      }

      return data.map((row: any): HajiFinanceRecord => ({
        id: row.id,
        inquiryId: row.inquiry_id,
        registrationRef: row.registration_ref,
        hajiType: (row.haji_type as 'hajj' | 'umrah') || 'hajj',
        yearSeason: row.year_season || '২০২৬',
        hajiName: row.haji_name || '',
        hajiNameBn: row.haji_name_bn,
        phone: row.phone || '',
        email: row.email,
        nidNo: row.nid_no,
        passportNo: row.passport_no,
        district: row.district,
        packageName: row.package_name || '',
        packagePrice: Number(row.package_price || 0),
        discountAmount: Number(row.discount_amount || 0),
        finalTotalAmount: Number(row.final_total_amount || 0),
        totalDeposited: Number(row.total_deposited || 0),
        dueAmount: Number(row.due_amount || 0),
        paymentStatus: row.payment_status || 'due',
        payments: Array.isArray(row.payments) ? row.payments : [],
        expenses: Array.isArray(row.expenses) ? row.expenses : [],
        totalExpense: Number(row.total_expense || 0),
        netProfit: Number(row.net_profit || 0),
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch {
      return null;
    }
  },

  // Save Office Expense to Supabase
  async saveOfficeExpense(expense: OfficeExpense): Promise<boolean> {
    try {
      const payload = {
        id: expense.id,
        title: expense.title,
        entry_type: expense.entryType || 'expense',
        category: expense.category,
        amount: expense.amount ?? 0,
        date: expense.date,
        expense_type: expense.expenseType || 'general',
        year_season: expense.yearSeason || '২০২৬',
        paid_by: expense.paidBy || null,
        voucher_no: expense.voucherNo || null,
        note: expense.note || null,
        created_at: expense.createdAt || new Date().toISOString()
      };

      const { error } = await supabase
        .from('office_expenses')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('Could not find')) {
          await this.saveAppStorageItem(`off_exp_${expense.id}`, expense);
        }
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  // Delete Office Expense from Supabase
  async deleteOfficeExpense(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('office_expenses').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  },

  // Fetch Office Expenses from Supabase
  async fetchOfficeExpenses(): Promise<OfficeExpense[] | null> {
    try {
      const { data, error } = await supabase
        .from('office_expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error || !data) {
        const cached = await this.getAppStorageItem<OfficeExpense[]>('all_office_expenses');
        if (cached && Array.isArray(cached)) return cached;
        return null;
      }

      return data.map((row: any): OfficeExpense => ({
        id: row.id,
        title: row.title,
        entryType: (row.entry_type as any) || 'expense',
        category: row.category,
        amount: Number(row.amount || 0),
        date: row.date,
        expenseType: row.expense_type || 'general',
        yearSeason: row.year_season,
        paidBy: row.paid_by,
        voucherNo: row.voucher_no,
        note: row.note,
        createdAt: row.created_at
      }));
    } catch {
      return null;
    }
  },

  // Mass sync all local application data to Supabase
  async syncAllToSupabase(data: {
    inquiries: InquiryItem[];
    pricingConfig: KafelaPricingConfig;
    contactMessages: ContactMessage[];
    reviews: ReviewItem[];
    companyInfo: CompanyInfo;
    hajiFinanceRecords?: HajiFinanceRecord[];
    officeExpenses?: OfficeExpense[];
  }): Promise<{
    success: boolean;
    syncedInquiries: number;
    syncedMessages: number;
    syncedReviews: number;
    syncedFinanceRecords: number;
    syncedOfficeExpenses: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let syncedInquiries = 0;
    let syncedMessages = 0;
    let syncedReviews = 0;
    let syncedFinanceRecords = 0;
    let syncedOfficeExpenses = 0;

    // 1. Sync Inquiries
    for (const inq of data.inquiries) {
      const ok = await this.saveInquiry(inq);
      if (ok) syncedInquiries++;
    }
    if (syncedInquiries < data.inquiries.length) {
      errors.push(`হাজী নিবন্ধন: ${data.inquiries.length - syncedInquiries} টি সিঙ্ক হয়নি (টেবিল তৈরি করা আছে কি না চেক করুন)`);
    }

    // 2. Sync Pricing
    const pricingOk = await this.savePricingConfig(data.pricingConfig);
    if (!pricingOk) {
      errors.push('প্যাকেজ ও মূল্য তালিকা সিঙ্ক হয়নি');
    }

    // 3. Sync Contact Messages
    for (const msg of data.contactMessages) {
      const ok = await this.saveContactMessage(msg);
      if (ok) syncedMessages++;
    }

    // 4. Sync Reviews
    for (const rev of data.reviews) {
      const ok = await this.saveReview(rev);
      if (ok) syncedReviews++;
    }

    // 5. Sync Haji Finance Records (মূল হজ ও ওমরাহ্ আয়-ব্যয়)
    if (data.hajiFinanceRecords && data.hajiFinanceRecords.length > 0) {
      for (const rec of data.hajiFinanceRecords) {
        const ok = await this.saveHajiFinanceRecord(rec);
        if (ok) syncedFinanceRecords++;
      }
      // Backup snapshot
      await this.saveAppStorageItem('all_haji_finance_records', data.hajiFinanceRecords);
    }

    // 6. Sync Office Expenses
    if (data.officeExpenses && data.officeExpenses.length > 0) {
      for (const exp of data.officeExpenses) {
        const ok = await this.saveOfficeExpense(exp);
        if (ok) syncedOfficeExpenses++;
      }
      await this.saveAppStorageItem('all_office_expenses', data.officeExpenses);
    }

    // 7. Sync Company Info
    await this.saveCompanyInfo(data.companyInfo);

    // 8. Full snapshot in app_storage
    await this.saveAppStorageItem('full_backup_snapshot', {
      timestamp: new Date().toISOString(),
      inquiriesCount: data.inquiries.length,
      pricing: data.pricingConfig,
      financeCount: data.hajiFinanceRecords?.length || 0,
      officeExpCount: data.officeExpenses?.length || 0
    });

    return {
      success: errors.length === 0,
      syncedInquiries,
      syncedMessages,
      syncedReviews,
      syncedFinanceRecords,
      syncedOfficeExpenses,
      errors
    };
  },
  async saveSiteSettings(settings: unknown): Promise<boolean> {
    try {
      if (!isSupabaseConfigured) return false;
      const { error } = await supabase.from('site_settings').upsert({ key: 'site', value: settings });
      return !error;
    } catch { return false; }
  },
  async fetchSiteSettings(): Promise<unknown | null> {
    try {
      if (!isSupabaseConfigured) return null;
      const { data, error } = await supabase.from('site_settings').select('value').eq('key', 'site').single();
      if (error || !data) return null;
      return (data as any).value;
    } catch { return null; }
  },
  async saveAdsSlots(slots: unknown): Promise<boolean> {
    try {
      if (!isSupabaseConfigured) return false;
      const rows = Array.isArray(slots) ? slots : [];
      for (const slot of rows as any[]) {
        const { error } = await supabase.from('ads_slots').upsert({ id: slot.id, page: slot.page, provider: slot.provider, ad_code: slot.adCode || '', ad_link: slot.adLink || '', is_enabled: !!slot.isEnabled, data: slot });
        if (error) return false;
      }
      return true;
    } catch { return false; }
  },
  async saveDeveloperCredit(credit: unknown): Promise<boolean> {
    try {
      if (!isSupabaseConfigured) return false;
      const c: any = credit || {};
      const { error } = await supabase.from('developer_credit').upsert({ name: c.name || '', photo_url: c.photoUrl || '', phone: c.phone || '', email: c.email || '', social_links: { facebook: c.facebook || '', youtube: c.youtube || '', whatsapp: c.whatsapp || '' }, is_active: true });
      return !error;
    } catch { return false; }
  },

  async saveService(service: any): Promise<boolean> {
    try {
      if (!isSupabaseConfigured) return false;
      const { error } = await supabase.from('services').upsert({
        id: service.id,
        title: service.title,
        description: service.description || '',
        icon: service.icon || null,
        image_url: service.imageUrl || null,
        features: service.features || [],
        is_active: service.isApproved !== false,
        data: service,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
      return !error;
    } catch { return false; }
  },
  async deleteService(id: string): Promise<boolean> {
    try {
      if (!isSupabaseConfigured) return false;
      const { error } = await supabase.from('services').delete().eq('id', id);
      return !error;
    } catch { return false; }
  },
  async fetchServices(): Promise<any[] | null> {
    try {
      if (!isSupabaseConfigured) return null;
      const { data, error } = await supabase.from('services').select('*').order('created_at', { ascending: false });
      if (error || !data) return null;
      return data.map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        icon: row.icon,
        imageUrl: row.image_url,
        features: row.features || [],
        isApproved: row.is_active !== false,
        ...(row.data || {})
      }));
    } catch { return null; }
  },
  async saveGalleryItem(item: any): Promise<boolean> {
    try {
      if (!isSupabaseConfigured) return false;
      const { error } = await supabase.from('gallery').upsert({
        id: item.id,
        title: item.title || '',
        image_url: item.imageUrl || null,
        video_url: item.videoUrl || null,
        media_type: item.mediaType || 'image',
        category: item.category || 'hajj',
        caption: item.caption || '',
        is_active: item.isApproved !== false,
        data: item,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
      return !error;
    } catch { return false; }
  },
  async deleteGalleryItem(id: string): Promise<boolean> {
    try {
      if (!isSupabaseConfigured) return false;
      const { error } = await supabase.from('gallery').delete().eq('id', id);
      return !error;
    } catch { return false; }
  },
  async fetchGalleryItems(): Promise<any[] | null> {
    try {
      if (!isSupabaseConfigured) return null;
      const { data, error } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
      if (error || !data) return null;
      return data.map((row: any) => ({
        id: row.id,
        title: row.title,
        imageUrl: row.image_url,
        videoUrl: row.video_url,
        mediaType: row.media_type || 'image',
        category: row.category || 'hajj',
        caption: row.caption,
        isApproved: row.is_active !== false,
        ...(row.data || {})
      }));
    } catch { return null; }
  },
  async saveTeamMember(member: any): Promise<boolean> {
    try {
      if (!isSupabaseConfigured) return false;
      const { error } = await supabase.from('team').upsert({
        id: member.id,
        name: member.name,
        role: member.role || null,
        designation: member.designation || null,
        phone: member.phone || null,
        email: member.email || null,
        photo_url: member.photoUrl || member.imageUrl || null,
        bio: member.bio || null,
        is_active: member.isApproved !== false,
        data: member,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
      return !error;
    } catch { return false; }
  },
  async deleteTeamMember(id: string): Promise<boolean> {
    try {
      if (!isSupabaseConfigured) return false;
      const { error } = await supabase.from('team').delete().eq('id', id);
      return !error;
    } catch { return false; }
  },
  async fetchTeamMembers(): Promise<any[] | null> {
    try {
      if (!isSupabaseConfigured) return null;
      const { data, error } = await supabase.from('team').select('*').order('created_at', { ascending: false });
      if (error || !data) return null;
      return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        role: row.role,
        designation: row.designation,
        phone: row.phone,
        email: row.email,
        imageUrl: row.photo_url,
        photoUrl: row.photo_url,
        bio: row.bio,
        isApproved: row.is_active !== false,
        ...(row.data || {})
      }));
    } catch { return null; }
  },
  async savePrayerSchedule(schedule: any[]): Promise<boolean> {
    try {
      if (!isSupabaseConfigured) return false;
      const map: Record<string, string> = {};
      schedule.forEach((p) => {
        if (p.nameEn) map[p.nameEn.toLowerCase()] = `${p.time} (${p.iqamah})`;
      });
      const { error } = await supabase.from('prayer_schedule').upsert({
        id: 'current',
        fajr: map.fajr || '05:00 AM',
        sunrise: map.sunrise || '06:15 AM',
        dhuhr: map.dhuhr || '12:05 PM',
        asr: map.asr || '03:45 PM',
        maghrib: map.maghrib || '05:35 PM',
        isha: map.isha || '07:00 PM',
        jummah: map.jummah || '01:15 PM',
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
      await this.saveAppStorageItem('prayer_schedule', schedule);
      return !error;
    } catch { return false; }
  },
  async saveNotice(notice: any): Promise<boolean> {
    try {
      if (!isSupabaseConfigured) return false;
      const payload = {
        id: notice.id,
        title: notice.title,
        content: notice.content,
        image_url: notice.imageUrl || null,
        category: notice.category || 'general',
        date: notice.date || new Date().toISOString().split('T')[0],
        is_pinned: !!notice.isPinned,
        is_active: notice.isActive !== false,
        published_by: notice.publishedBy || 'admin',
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from('notices').upsert(payload, { onConflict: 'id' });

      // Always also backup to app_storage so other browsers or instances sync smoothly
      try {
        const cached = (await this.getAppStorageItem<any[]>('notices_list')) || [];
        const filtered = cached.filter((n: any) => n.id !== notice.id);
        await this.saveAppStorageItem('notices_list', [notice, ...filtered]);
      } catch {}

      return !error;
    } catch { return false; }
  },
  async deleteNotice(id: string): Promise<boolean> {
    try {
      if (!isSupabaseConfigured) return false;
      const { error } = await supabase.from('notices').delete().eq('id', id);
      try {
        const cached = (await this.getAppStorageItem<any[]>('notices_list')) || [];
        const filtered = cached.filter((n: any) => n.id !== id);
        await this.saveAppStorageItem('notices_list', filtered);
      } catch {}
      return !error;
    } catch { return false; }
  },
  async fetchNotices(): Promise<any[] | null> {
    try {
      if (!isSupabaseConfigured) return null;
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        // Fallback to app_storage
        const cached = await this.getAppStorageItem<any[]>('notices_list');
        if (cached && Array.isArray(cached) && cached.length > 0) {
          return cached;
        }
        return null;
      }

      return data.map((row: any) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        imageUrl: row.image_url,
        category: row.category,
        date: row.date,
        isPinned: !!row.is_pinned,
        isActive: row.is_active !== false,
        publishedBy: row.published_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch { return null; }
  }
};
