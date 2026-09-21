# Local admin for Memories

The Memories dashboard uses a server-configured admin account, not Supabase Auth.
The public gallery still reads Supabase with its public key. Existing songs are unchanged.

## Configuration

Set these in `.env.local` locally, or the hosting environment in production:

- `ADMIN_USERNAME`: admin login name.
- `ADMIN_PASSWORD`: a unique password of at least 12 characters.
- `ADMIN_SESSION_SECRET`: a random secret of at least 32 characters.
- `SUPABASE_SERVICE_ROLE_KEY`: the service-role key from the same Supabase project.
- Keep the existing `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Never prefix the admin credentials, session secret, or service-role key with
`NEXT_PUBLIC_`. Never commit `.env.local`. Restart the server after changing it.
Production requires HTTPS for the Secure session cookie.

The tables and bucket from `public/data/memories-setup.sql` must already exist.
If that script was already run, do not reset anything. Registering a user in
`memory_admins` is no longer necessary for this server upload flow. Old policies
and manager memberships remain intact; revoke old memberships separately if needed.

## Security and deployment

Login issues an HTTP-only, SameSite=Strict signed cookie lasting eight hours.
Changing the password or session secret invalidates existing sessions. Logout
clears the current browser cookie; it does not revoke a stolen copy globally.
Mutations verify Origin and uploads require a valid session before using the
service-role client. RLS remains enabled for public/browser requests.

Login has a 10-attempt/minute instance-local limit. Use a shared/upstream rate
limit for multi-instance production deployments. API uploads accept up to 10 MB;
some hosting providers impose a lower request-body limit. Adjust that limit or
use smaller images on such hosts. This feature requires a Next.js server, not
a static export. Login protects Memories uploads only, not unrelated song tools.