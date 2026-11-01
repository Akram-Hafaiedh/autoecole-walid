# Auto-École Walid

Public website and internal management tool for a driving school.
Next.js (App Router), TypeScript, Tailwind CSS.

## Structure

```
app/
  layout.tsx            root layout (fonts, site metadata, lang="fr")
  globals.css           colour tokens (light + dark) shared by both areas
  (public)/             marketing site: /, /formules, /contact
  (admin)/admin/        internal tool: dashboard, eleves, moniteurs, vehicules, planning
  (auth)/connexion/     login page: email code, no password
actions/
  auth.ts               server actions: requestCode, verifyCode, logout
  students.ts           server actions: createStudent, updateStudent
  instructors.ts        server actions: createInstructor, updateInstructor
  cars.ts               server actions: createCar, updateCar (plate must be unique)
  lessons.ts            server actions: createLesson, updateLesson (double-booking messages)
components/
  auth/LoginForm.tsx    login form (client component)
  admin/AdminNav.tsx    sidebar links with icons and the active page marked
  admin/PageHeader.tsx  page title, back link and action buttons
  ui/                   Icon, Logo, Avatar, Pill, EmptyState, FormParts (Section, Field,
                        FormError), useFormFields (shared form plumbing)
  students/             StudentForm, StatusPill
  instructors/          InstructorForm
  cars/                 CarForm, PlateChip, ServicePill
  planning/             PlanningGrid (week and day), DayAgenda (phone), LessonForm
lib/
  site.ts               school name, phone, hours, offers (edit this first)
  ui.ts                 shared class strings: buttons, input, panel
  prisma.ts             shared Prisma client (import { prisma } from "@/lib/prisma")
  otp.ts                login codes and session tokens (node:crypto only)
  mail.ts               sends the login code by email (Resend)
  auth.ts               requireAdmin(), session cookie helpers
  students.ts           student form validation and labels
  instructors.ts        instructor form validation
  cars.ts               car form validation and the service-date logic
  format.ts             isUuid, initials, formatDate and other small helpers
  form.ts               FormState type and readFields for the forms
  validation.ts         phone, email and date checks shared by the forms
  db-errors.ts          isUniqueViolation (P2002), isForeignKeyViolation (P2003)
  time.ts               dates and times on the school's clock (Africa/Tunis)
  lessons.ts            lesson form validation, durations, conflict messages
  planning.ts           grid layout: side-by-side lanes, visible hours, URLs
prisma/
  schema.prisma         data model (students, instructors, cars, lessons)
  constraints.sql       double-booking rules Prisma cannot express
  seed-data.ts          fake students, instructors, cars and lessons (pure data)
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

## Instructors and cars

`/admin/moniteurs` and `/admin/vehicules` show one card per person or car, with
the number of upcoming lessons (0 until the planning exists). Nothing is deleted,
because lessons refer to both: set a moniteur to "Inactif" or a car to
"Hors service" and it stops being offered in the planning, while its history stays.

A car's plate must be unique (spaces and case are ignored: `214  tun 8841` is
`214 TUN 8841`). Each car has a "prochain entretien" date. The dashboard lists
cars whose service is overdue or due within 30 days (`SERVICE_SOON_DAYS` in
`lib/cars.ts`).

## Planning

`/admin/planning` has two views. **Semaine** shows the seven days, Monday to Sunday.
**Jour** shows one day with a column per instructor, which is the easiest way to see
who does what. The chips filter by instructor, the menu by car, and "Annulées"
shows cancelled lessons too. On a phone the grid becomes a list of days.

A lesson has no fixed slot. It starts at any time and lasts anything from 15 minutes
to 12 hours (quick buttons for 1 h, 1 h 30, 2 h, 3 h, 4 h and 8 h, or type the
minutes). It must end before midnight. The grid starts at 06:00 and ends at 21:00,
and grows by itself when a lesson falls outside (`DEFAULT_START_HOUR` and
`DEFAULT_END_HOUR` in `lib/planning.ts`).

Times are shown on the school's clock, `timeZone` in `lib/site.ts` (Africa/Tunis),
whatever the server or the browser uses.

When a lesson would overlap another one for the same instructor, car or student,
the form says which one is busy and from when to when. The database enforces the
same rule (`prisma/constraints.sql`), so two people saving at the same moment cannot
both get through. A cancelled lesson frees its slot. A code lesson never has a car,
a driving lesson always has one, an exam may have one. Lessons are cancelled, not
deleted: set the status to "Annulée".

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

The seed also creates 102 demo lessons over this week and next (1 h to 8 h,
starting as early as 06:00, code lessons, back-to-back lessons, weekends included,
past ones marked done, absent or cancelled), with notes starting `[démo]`. Running it
again replaces them. To remove them by hand:

```sql
DELETE FROM lessons WHERE notes LIKE '[démo]%';
```

It also creates 4 instructors (email ending `@seed.invalid`) and 6 cars
(notes starting `[démo]`), covering every service state. A demo instructor or car
that already has lessons is kept when you re-run it. To remove them by hand:

```sql
DELETE FROM instructors WHERE email LIKE '%@seed.invalid';
DELETE FROM cars WHERE notes LIKE '[démo]%';
```

Do not run it against the production database.

## Not built yet

- Roles beyond the single owner (for example instructors with their own login).
- The lesson history on each student's page.
- Payments, per session or per hour (both are planned).
- SMS/WhatsApp reminders.

## Notes

`AGENTS.md` says this Next.js version (16.2.4) differs from older releases
and points to the docs inside `node_modules/next/dist/docs/`. Read the
relevant page there before changing routing, caching or data fetching.
