# RiskWatch authentication and workspace storage

The branded `/sign-in` and `/sign-up` screens use Clerk for account creation,
sign-in, and sign-out. Clerk stores account identity; Supabase stores each signed-in
user's editable workspace state. The dashboard remains publicly viewable with
synthetic demo data.

## Local configuration

1. Copy `.env.example` to `.env.local` if you have not already configured the app.
2. Set the Clerk publishable and secret keys from the selected Clerk application.
   Never expose `CLERK_SECRET_KEY` in browser code or commit `.env.local`.
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in
   `.env.local`, using the project API URL and publishable key from the Supabase
   project's API settings. A PostgreSQL database connection string is not a
   substitute for either value. Never put a database password or service-role key
   in a `NEXT_PUBLIC_` variable.
4. In the Clerk Dashboard, enable open sign-up and configure the email verification
   method you want. Add local and production app URLs to Clerk's allowed redirect
   origins.
5. In Clerk's Supabase integration settings, activate the Supabase integration.
   In Supabase, add Clerk under **Authentication → Sign In / Providers → Third-Party
   Auth** using the Clerk domain. The Clerk session token must provide the
   `authenticated` role claim.
6. Apply `supabase/migrations/20261028040059_user_workspace_state.sql` to the Supabase
   project. The table stores one JSON workspace per Clerk user ID and uses RLS to
   restrict select, insert, update, and delete to that token's `sub` claim. The
   migration has not been applied to the remote project by this code change.

Restart the development server after changing environment variables or provider
settings.

## Workspace behavior

- Signed-out visitors can continue using the synthetic demo; demo changes remain in
  the existing local browser storage.
- Signed-in users load and save their editable cases, alerts, rules, audit entries,
  dataset metadata, and selected analyst role in Supabase.
- The signed-out demo state is not imported into a user's account. User identity and
  profile details remain in Clerk; no duplicate profile table is created in Supabase.
- The save indicator in the dashboard top bar shows whether the signed-in workspace
  is saving, saved, or needs attention. If loading fails, use **Retry** before making
  changes.
- Sign out returns to the public synthetic demo. This does not protect the dashboard
  or make the synthetic demo confidential. Do not connect real customer or financial
  records without separately implementing and reviewing authorization for every
  relevant route and data source.

## Existing Supabase Auth

The former Supabase magic-link callback and client helpers are retained temporarily
for rollout compatibility, but the branded sign-in and sign-up pages now use Clerk.
Supabase Auth users and database records are not deleted or imported. The former flow
used email links only, with no passwords or social providers configured; users must
sign in through Clerk after open sign-up is enabled. Validate Clerk authentication,
Supabase third-party tokens, and RLS isolation before removing the legacy callback or
changing remote authentication settings.
