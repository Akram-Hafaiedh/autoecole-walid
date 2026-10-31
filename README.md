# Auto-École Walid

Public website and internal management tool for a driving school.
Next.js (App Router), TypeScript, Tailwind CSS.

## Structure

```
app/
  layout.tsx            root layout (fonts, site metadata, lang="fr")
  globals.css           colour tokens (light + dark) shared by both areas
  (public)/             marketing site: /, /formules, /contact
  (admin)/admin/        internal tool: dashboard, /admin/eleves (list, new, edit)
  (auth)/connexion/     login page: email code, no password
actions/
  auth.ts               server actions: requestCode, verifyCode, logout
  students.ts           server actions: createStudent, updateStudent
components/
  auth/LoginForm.tsx    login form (client component)
  admin/AdminNav.tsx    sidebar links with icons and the active page marked
  admin/PageHeader.tsx  page title, back link and action buttons
  ui/Icon.tsx, Logo.tsx small stroke icons and the logo mark
  students/StudentAvatar.tsx, StatusPill.tsx  initials avatar and status pill
  students/StudentForm.tsx  shared create/edit form
lib/
  site.ts               school name, phone, hours, offers (edit this first)
  ui.ts                 shared class strings: buttons, input, panel
  prisma.ts             shared Prisma client (import { prisma } from "@/lib/prisma")
  otp.ts                login codes and session tokens (node:crypto only)
  mail.ts               sends the login code by email (Resend)
  auth.ts               requireAdmin(), session cookie helpers
  students.ts           student form validation and labels (no imports, testable)
prisma/
  schema.prisma         data model (students, instructors, cars, lessons)
  constraints.sql       double-booking rules Prisma cannot express
  seed-data.ts          fake students for trying the screens (pure data)
  seed.ts               loads them into the database: npm run db:seed
prisma.config.ts        Prisma 7 config (reads DATABASE_URL)
proxy.ts                redirects /admin/* to /connexion when the session cookie is missing or invalid
```

## Design

The look is built on road signage. All colours are tokens in `app/globals.css`
(light and dark); change the brand there, not in individual components.

- **Type:** Overpass (a road-sign typeface, loaded in `app/layout.tsx`) for
  headings, numbers and the logo; Geist for everything else. Use `font-display`
  for the first group.
- **Colour:** signal green for actions, a deep asphalt green for the sidebar
  and the login panel, a concrete-grey page background. Status colours follow
  road-sign meaning: green for in progress, amber for on hold, blue for finished.
- **Signature:** the yellow road centre-line, used only in the logo, the active
  sidebar marker and the login panel (`.road-line`). Keep it that rare.
- **Pieces:** `panel`, `input`, `btnPrimary`, `btnSecondary` and `btnGhost` in
  `lib/ui.ts`; `PageHeader` at the top of every admin page.

## Before the site goes live

Open `lib/site.ts` and replace every line marked `TODO`: phone, WhatsApp,
email, address, opening hours and prices. Until then the pages show
placeholders and "Sur demande" instead of prices.

## Run locally

```bash
npm install            # also runs `prisma generate`
cp .env.example .env   # then set DATABASE_URL
npm run dev
```

Then open http://localhost:3000.

## Database

Prisma 7 with PostgreSQL (Supabase or Neon). The model is in
`prisma/schema.prisma`; the generated client goes to `app/generated/prisma`
(ignored by git) and is rebuilt by `npm install`.

Prisma cannot express the double-booking rules, so they live in
`prisma/constraints.sql`. Set them up once, when you create the first migration:

```bash
npx prisma migrate dev --name init --create-only
```

1. Open `prisma/migrations/<timestamp>_init/migration.sql`.
2. Paste the whole content of `prisma/constraints.sql` at the end.
3. Apply it with `npm run db:migrate`.

The database then refuses a lesson that overlaps another one for the same
instructor, car or student. Cancelled lessons free their slot. Back-to-back
lessons (11:00 end, 11:00 start) are allowed. A driving lesson requires a car;
a code lesson does not. Later migrations need nothing extra.

Row level security is enabled with no policies, so a public key reads
nothing. The app must read and write through the server after checking that
the visitor is logged in.

When a lesson is refused, Prisma raises an error on the constraint name
(`lessons_no_instructor_overlap`, `lessons_no_car_overlap`,
`lessons_no_student_overlap`). Catch it and show a clear message.

## Login

There is one user: the owner. No password. He clicks "Recevoir un code par
e-mail" on `/connexion`, gets a 6-digit code at `ADMIN_EMAIL`, types it, and
lands on `/admin`. The session lasts 7 days.

Because there is no password, whoever controls that mailbox controls the
dashboard. Turn on 2-step verification on the owner's email account.

Rules enforced in `actions/auth.ts` and `lib/otp.ts`:

- A code is valid 10 minutes, works once, and stops working after 5 guesses.
- Only the newest code works. One request per minute, 5 per hour.
- The database stores only a keyed hash of each code (`login_codes` table).
- The session cookie is `httpOnly`, `sameSite=lax`, and `secure` in production.
- Changing `SESSION_SECRET` signs everyone out.

Setup: set `ADMIN_EMAIL`, `SESSION_SECRET` (`openssl rand -base64 32`),
`RESEND_API_KEY` and `MAIL_FROM` in `.env` (see `.env.example`). In development
you can leave `RESEND_API_KEY` empty: the code is printed in the terminal.
In production, verify a domain in Resend. Until then Resend only delivers to
the email of your own Resend account.

Every admin page, layout and server action must call `await requireAdmin()`
from `lib/auth.ts`. Do not rely on the layout alone.

`proxy.ts` adds a quick cookie check in front of `/admin/*`. It is a safety net
against a forgotten `requireAdmin()`, not a replacement for it.

## Students

`/admin/eleves` lists students 15 per page (search by name or phone, filter by
status; archived students are hidden by default; search and filter are kept when
you change page). `/admin/eleves/nouveau` creates one
and `/admin/eleves/<id>` edits one. Students are never deleted, because lessons
refer to them: set the status to "Archivé" instead. The national ID is only
loaded on the edit page, never in the list.

### Fake data

To try the list, search, filters and pagination with something on screen:

```bash
npm run db:seed
```

This creates 46 invented students (32 active, 6 paused, 5 completed, 3
archived; every name, phone and email is made up). Each has a national ID
starting with `SEED-`. Running it again replaces them, and real students are
never touched. To remove them by hand:

```sql
DELETE FROM students WHERE national_id LIKE 'SEED-%';
```

Do not run it against the production database.

## Not built yet

- Roles beyond the single owner (for example instructors with their own login).
- Instructor, car and lesson screens (the planning with double-booking checks).
- Payments and SMS/WhatsApp reminders.

## Notes

`AGENTS.md` says this Next.js version (16.2.4) differs from older releases
and points to the docs inside `node_modules/next/dist/docs/`. Read the
relevant page there before changing routing, caching or data fetching.
