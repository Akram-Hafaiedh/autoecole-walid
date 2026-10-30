# Auto-École Walid

Public website and internal management tool for a driving school.
Next.js (App Router), TypeScript, Tailwind CSS.

## Structure

```
app/
  layout.tsx            root layout (fonts, site metadata, lang="fr")
  globals.css           colour tokens (light + dark) shared by both areas
  (public)/             marketing site: /, /formules, /contact
  (admin)/admin/        internal tool: /admin (shell only for now)
  (auth)/connexion/     login page: email code, no password
actions/
  auth.ts               server actions: requestCode, verifyCode, logout
components/
  auth/LoginForm.tsx    login form (client component)
lib/
  site.ts               school name, phone, hours, offers (edit this first)
  ui.ts                 shared button classes
  prisma.ts             shared Prisma client (import { prisma } from "@/lib/prisma")
  otp.ts                login codes and session tokens (node:crypto only)
  mail.ts               sends the login code by email (Resend)
  auth.ts               requireAdmin(), session cookie helpers
prisma/
  schema.prisma         data model (students, instructors, cars, lessons)
  constraints.sql       double-booking rules Prisma cannot express
prisma.config.ts        Prisma 7 config (reads DATABASE_URL)
```

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

## Not built yet

- Roles beyond the single owner (for example instructors with their own login).
- Database connection and the student, instructor, car and lesson screens.
- Payments and SMS/WhatsApp reminders.

## Notes

`AGENTS.md` says this Next.js version (16.2.4) differs from older releases
and points to the docs inside `node_modules/next/dist/docs/`. Read the
relevant page there before changing routing, caching or data fetching.
