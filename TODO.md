# TODO

What the project does not have yet, most important first. Tick a box when it is done.

## Next, in this order

1. [x] **Public pages redesign.** Bring the public site up to the look of the login page and the dashboard.
2. [ ] **Payments.** What is left: a printable receipt.
    - [x] Price list, discounts and a price per lesson (Tarifs page)
    - [x] Payments, discounts and prices per student (`/admin/eleves/[id]/paiements`)
    - [x] Monthly summary and money figures on the dashboard (`/admin/bilan`)
    - [x] Year view of the summary (`/admin/bilan?vue=annee`)
    - [ ] Printable receipt for a payment
3. [ ] **Student profile.** What is left: hours needed against hours done, and the steps of the licence.
    - [x] Overview at the top of the student page (hours driven, code sessions, next lesson, balance)
    - [x] Every lesson with its amount (`/admin/eleves/[id]/paiements`)
    - [ ] Hours needed per licence category, and progress against it (the owner gives the numbers)
    - [ ] Steps of the licence (code exam, driving exam) with dates
4. [x] **"Comptes" page** (`/admin/comptes`). Activate or remove registered accounts from the dashboard. Roles beyond "admin" are under Roles below.
5. [ ] **Public site content and contact form.** Real hours, prices, photos and address in `lib/site.ts`, plus a form that creates a prospect the owner can follow up.
6. [ ] **SMS or WhatsApp reminders** about lessons. Last, because it needs a paid messaging service.

## Running the school

- [ ] **Student page, right-hand side.** On a wide screen the space next to the student form is empty on purpose. Keep it for whatever the school needs there later (documents, exam dates, notes).

- [ ] **Roles.** Owner, secretary, and an instructor who only sees their own lessons (today an account is either `user`, with no access, or `admin`).
- [ ] **Availability.** Working hours and days off per instructor, downtime per car. The planning only prevents overlaps; it does not know that an instructor does not work on Friday.
- [ ] **Recurring lessons.** Every lesson is created one by one.
- [ ] **Exams.** Exam dates per student, shown in the planning.
- [ ] **Student documents.** A place for the ID copy, medical certificate and photos.
- [ ] **History of changes.** Who edited what, and when.
- [ ] **Instructor timesheet.** A printable month sheet per instructor (day by day: lessons, hours), built from the lessons already marked done, for pay. Real clock-in and clock-out only if instructors are paid for time outside lessons.
- [ ] **Reports and export.** Monthly figures, and a way to export students and payments.

## Public site

- [ ] Replace every placeholder in `lib/site.ts` (phone, WhatsApp, address, hours, prices, e-mail).
- [ ] Arabic version (right-to-left), which many visitors will expect.
- [ ] Real photos of the school and its cars.
- [ ] Search engine basics: a sitemap, a page title and description per page, the school on Google Maps.

## Technical

- [ ] Automated tests for the lesson rules (double booking, durations, time zone) and for the login.
- [ ] Password reset. There is no e-mail sending now, so today the owner resets a password by running `npm run auth:create-admin` again.
- [ ] Database backups, and error monitoring on the live site.
- [ ] A check in the repository that runs the build and the type check on every push.
- [ ] Look at the Tunisian personal-data rules for the national ID number and the documents we store.

## Things to remember

- A deploy never touches the database. Migrations and seed run by hand against the production `DATABASE_URL` (`npx prisma migrate deploy`, then `npm run db:seed`).
- The demo data (students, instructors, cars, lessons marked "[démo]") must be removed before the school starts using the dashboard for real.
- Sign-in rate limiting counts every request, successful or not, and only runs in production.
