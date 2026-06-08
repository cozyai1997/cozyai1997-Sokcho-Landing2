# Sokcho-Landing2

Resort magazine style landing page for Sokcho Jungang Heights THE 228.

This project reuses the original Sokcho THE 228 assets and keeps the existing reservation, admin, Supabase, and SOLAPI MMS flows, but stores Landing2 data in separate Supabase tables.

## Local Development

```powershell
npm.cmd install
npm.cmd run dev
```

Open the Vite URL and use `/#admin` for the lead management page.

## Verification

```powershell
npm.cmd run verify:landing2
npm.cmd run build
npx.cmd tsc --noEmit --target ES2020 --module ESNext --moduleResolution Bundler --esModuleInterop --skipLibCheck --types node api\leads.ts api\sms-template.ts api\_sms.ts api\_supabase.ts
```

## Supabase Tables

Run `docs/supabase-landing2-setup.sql` in the Sokcho Supabase project before connecting production.

Landing2 uses:

- `sokcho_landing2_leads`
- `sokcho_landing2_sms_settings`

New reservations are saved with `source = 'landing2-resort-magazine'`.

## Environment Variables

Set these in Vercel when creating the new project:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_ADMIN_TOKEN`
- `SOLAPI_API_KEY`
- `SOLAPI_API_SECRET`
- `SOLAPI_SENDER`

Do not commit `.env`, Vercel project files, Supabase secrets, or SOLAPI secrets.

## Future Vercel Setup

1. Create the GitHub repository `cozyai1997/Sokcho-Landing2`.
2. Push this project to `main`.
3. Import the repo into Vercel as a Vite project.
4. Add the environment variables above.
5. Run the Supabase setup SQL and configure the SMS MMS `imageId` in `/#admin`.
6. Deploy and test a new reservation plus duplicate-phone handling.
