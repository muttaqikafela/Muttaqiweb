# Muttaqi — updated port (local Vite project)

This project is the base GitHub code PLUS the following features ported
in code (not placeholders), verified by a Vite build:

- Single Admin-header sync button 'সব ডাটা সিঙ্ক করুন' only; no visible
  hosting name, logo, URL, key, SQL or connection card in the UI.
  The Admin 'Supabase ডাটাবেজ' tab and Finance SQL sub-tab are removed.
  Auto-sync on every Admin/public change (background, local data kept
  safe on failure), manual sync retries and shows only a neutral
  result + last sync time.
- Admin login without any demo-credentials display box.
- Haji registrations list in Admin with full profile, approve/edit/delete;
  hero pre-registration lands in Haji registrations, not general inquiries.
- Homepage gold 'অনলাইন হাজী রেজিস্ট্রেশন' button removed from the
  'পবিত্রতার কাফেলা ও বিশ্বস্ত সেবা' section only; other entry points kept.
- Finance: gold new-Haji-account button removed (office-expense button kept)
  and the registration-import tab removed; exactly 4 tabs remain.
- Admin tab bar: Booking/Inquiries tab entry removed; other tabs kept.
- ID card only for approved Hajis in their full Admin profile, with Print
  and PDF download; missing fields show 'প্রদান করা হয়নি', documents
  'সংযুক্ত নেই'; linked members shown when recorded, otherwise no section.
- Admin Settings (সাধারণ সেটিংস): header/logo, domain/favicon, body
  content, footer, colours — one save 'সব সেটিংস সংরক্ষণ করুন',
  persisted to localStorage and to hosting site_settings when configured,
  applied immediately (CSS variables, title, favicon, header/footer).
- Developer role, safe way only: same Admin login panel, developer email
  identifier only in code, first-login password setup storing only a
  salted SHA-256 hash in localStorage, Developer Panel (not an Admin tab)
  with Credit, per-page Ads, Global Management and Password Change.
  Credit/ads start empty. Normal Admin login shows no Developer UI.
- Supabase SQL: muttaqi-supabase-all.sql (16 tables, least-privilege RLS)
  in the project root. No project URL, key, .env file, plain password,
  or .github/workflows/deploy.yml is included.

Not ported as code: PNG images (public/assets images are not text files
and are excluded from the push list); the workflow file deploy.yml is
intentionally excluded because the GitHub App cannot create it.
