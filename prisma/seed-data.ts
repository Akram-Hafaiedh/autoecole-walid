// Fake students for trying out the admin screens. Pure data, no database access,
// so it can be tested on its own. Every name, phone number and email is invented.
//
// Every seeded student has a national ID starting with "SEED-". That is how
// seed.ts finds and replaces them on a re-run, and how you can remove them by hand:
//   DELETE FROM students WHERE national_id LIKE 'SEED-%';

import { chargeLesson, type ChargeSource, type StandardRate } from "../lib/billing";
import { addDays, utcToZoned, weekStart, weekdayOf, zonedTimeToUtc } from "../lib/time";

export const SEED_PREFIX = "SEED-";

const FIRST_NAMES = [
    "Amine", "Sami", "Yasmine", "Ines", "Mehdi", "Rim", "Karim", "Salma", "Nour", "Aymen",
    "Rania", "Hichem", "Sarra", "Oussama", "Mariem", "Bilel", "Hela", "Firas", "Chaima",
    "Marwen", "Khaoula", "Zied", "Emna", "Anis", "Dorra", "Skander", "Fatma", "Nizar",
    "Lina", "Rached", "Amal", "Seifeddine", "Yosra", "Haythem", "Mouna",
];

const LAST_NAMES = [
    "Ben Ali", "Trabelsi", "Gharbi", "Jebali", "Mansouri", "Bouazizi", "Hamdi", "Sassi",
    "Chebbi", "Ben Salah", "Dridi", "Khelifi", "Mejri", "Ayari", "Ben Youssef", "Zouari",
    "Karray", "Belhadj", "Rezgui", "Ferchichi", "Nasri", "Ouertani", "Haddad", "Messaoudi",
];

const NOTES = [
    "Préfère les leçons le matin.",
    "Examen du code prévu le mois prochain.",
    "A déjà passé le code une fois.",
    "Travaille l’après-midi, disponible avant 14h.",
    "Paiement en plusieurs fois.",
];

// Spread across the list so every filter shows something.
const STATUS_CYCLE = [
    "active", "active", "active", "paused", "active", "active", "completed", "active",
    "active", "archived", "active", "active", "paused", "active", "completed", "active",
] as const;

const LICENCE_CYCLE = ["B", "B", "B", "B", "B", "B", "A", "A1", "C", "B", "B", "D"] as const;

export type SeedStudent = {
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
    birthDate: Date | null;
    nationalId: string;
    licenceCategory: string;
    status: (typeof STATUS_CYCLE)[number];
    notes: string | null;
    createdAt: Date;
};

function slug(text: string): string {
    return text
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

/** Small deterministic generator, so every run produces the same students. */
function lcg(seed: number): () => number {
    let state = seed;
    return () => {
        state = (state * 1664525 + 1013904223) % 4294967296;
        return state / 4294967296;
    };
}

export function buildSeedStudents(count = 46, now: Date = new Date()): SeedStudent[] {
    const random = lcg(2026);
    const used = new Set<string>();
    const students: SeedStudent[] = [];

    for (let i = 0; i < count; i++) {
        let firstName: string;
        let lastName: string;
        do {
            firstName = FIRST_NAMES[Math.floor(random() * FIRST_NAMES.length)];
            lastName = LAST_NAMES[Math.floor(random() * LAST_NAMES.length)];
        } while (used.has(`${firstName} ${lastName}`));
        used.add(`${firstName} ${lastName}`);

        const number = String(i + 1).padStart(3, "0");
        const year = 1972 + Math.floor(random() * 37); // 1972 to 2008
        const month = 1 + Math.floor(random() * 12);
        const day = 1 + Math.floor(random() * 28);

        students.push({
            firstName,
            lastName,
            // Some students have no phone, email or birth date, so the "–" cells show up.
            phone: i % 9 === 4 ? null : `+216 ${20 + (i % 30)} 000 ${100 + i}`,
            email: i % 4 === 1 ? null : `${slug(firstName)}.${slug(lastName)}${i + 1}@example.com`,
            birthDate: i % 10 === 7 ? null : new Date(Date.UTC(year, month - 1, day)),
            nationalId: `${SEED_PREFIX}${number}`,
            licenceCategory: LICENCE_CYCLE[i % LICENCE_CYCLE.length],
            status: STATUS_CYCLE[i % STATUS_CYCLE.length],
            notes: i % 6 === 2 ? NOTES[(i / 6) % NOTES.length | 0] : null,
            createdAt: new Date(now.getTime() - (i * 3 + 1) * 24 * 60 * 60 * 1000),
        });
    }

    return students;
}

// ---------------------------------------------------------------------------
// Demo instructors and cars. Same idea as the students: invented data you can wipe.
//   Instructors: email ends with "@seed.invalid".
//   Cars: notes start with "[démo]".

export const SEED_INSTRUCTOR_DOMAIN = "@seed.invalid";
export const SEED_CAR_MARK = "[démo]";

export type SeedInstructor = {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    active: boolean;
};

export function buildSeedInstructors(): SeedInstructor[] {
    const people = [
        { firstName: "Walid", lastName: "Ben Amor", active: true },
        { firstName: "Slim", lastName: "Gharbi", active: true },
        { firstName: "Nadia", lastName: "Hamdi", active: true },
        { firstName: "Moez", lastName: "Jebali", active: false },
    ];
    return people.map((person, i) => ({
        ...person,
        phone: `+216 9${i} 000 20${i}`,
        email: `${slug(person.firstName)}.${slug(person.lastName)}${SEED_INSTRUCTOR_DOMAIN}`,
    }));
}

export type SeedCar = {
    label: string;
    plate: string;
    transmission: "manual" | "automatic";
    active: boolean;
    nextServiceDate: Date | null;
    notes: string;
};

export function buildSeedCars(now: Date = new Date()): SeedCar[] {
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const inDays = (days: number) => new Date(today + days * 86_400_000);

    // One overdue, one due soon, the rest far away, one not planned, one out of service,
    // so every state of the service badge shows up.
    return [
        { label: "Clio blanche", plate: "214 TUN 8841", transmission: "manual", active: true, nextServiceDate: inDays(-12) },
        { label: "Peugeot 208 grise", plate: "198 TUN 5527", transmission: "manual", active: true, nextServiceDate: inDays(9) },
        { label: "Dacia Sandero rouge", plate: "231 TUN 1093", transmission: "manual", active: true, nextServiceDate: inDays(74) },
        { label: "Kia Picanto bleue", plate: "205 TUN 7710", transmission: "automatic", active: true, nextServiceDate: inDays(140) },
        { label: "Hyundai i10 blanche", plate: "187 TUN 3368", transmission: "manual", active: true, nextServiceDate: null },
        { label: "Renault Symbol noire", plate: "142 TUN 9004", transmission: "manual", active: false, nextServiceDate: inDays(-40) },
    ].map((car) => ({ ...car, transmission: car.transmission as "manual" | "automatic", notes: `${SEED_CAR_MARK} Véhicule de démonstration.` }));
}

// ---------------------------------------------------------------------------
// Demo lessons: five weeks back, this week and next, so the planning and the monthly summary have something to show.
// Notes start with "[démo]" so seed.ts can find and replace them on a re-run.

export const SEED_LESSON_MARK = "[démo]";

export type SeedLesson = {
    studentId: string;
    instructorId: string;
    carId: string | null;
    kind: "driving" | "code" | "refresher";
    status: "scheduled" | "completed" | "cancelled" | "no_show";
    startsAt: Date;
    endsAt: Date;
    /** Millimes, set on done and absent lessons when a price list is given. */
    amount: number | null;
    chargeSource: ChargeSource | null;
    notes: string;
};

type Slot = readonly [start: string, minutes: number, kind: "driving" | "code" | "refresher"];

// A day for one instructor: start time, length in minutes, type. Short and long lessons,
// early starts, an evening, back-to-back lessons and a full 8-hour day all appear.
const DAYS: Record<string, readonly Slot[]> = {
    regular: [["08:00", 120, "driving"], ["10:30", 60, "driving"], ["14:00", 180, "driving"]],
    early: [["06:00", 120, "driving"], ["09:00", 120, "code"], ["16:00", 240, "driving"]],
    long: [["09:00", 480, "driving"]],
    short: [["08:00", 60, "driving"], ["09:00", 60, "driving"], ["10:00", 60, "driving"], ["18:00", 120, "refresher"]],
    off: [],
};

// Monday to Sunday. The weekend is the busiest part of the week.
const WEEK: readonly (keyof typeof DAYS)[] = ["regular", "off", "short", "regular", "early", "long", "early"];

export function buildSeedLessons(input: {
    students: { id: string; status: string }[];
    instructors: { id: string }[];
    cars: { id: string }[];
    now: Date;
    timeZone: string;
    /** The standard prices by kind, to bill done lessons. Without them nothing is billed. */
    rates?: Partial<Record<"driving" | "code" | "refresher", StandardRate>>;
}): SeedLesson[] {
    const { now, timeZone } = input;
    const students = input.students.filter((student) => student.status !== "archived");
    const team = input.instructors.slice(0, 3);
    if (students.length === 0 || team.length === 0) return [];

    const today = utcToZoned(now, timeZone).date;
    const start = addDays(weekStart(today), -35);
    const lessons: SeedLesson[] = [];
    let turn = 0;

    for (let offset = 0; offset < 49; offset++) {
        const date = addDays(start, offset);
        team.forEach((instructor, index) => {
            // Each instructor drives their own car, so no two lessons share one.
            const car = input.cars[index] ?? input.cars[0] ?? null;
            const plan = DAYS[WEEK[(weekdayOf(date) + index) % 7]];
            for (const [time, minutes, kind] of plan) {
                const startsAt = zonedTimeToUtc(date, time, timeZone);
                const endsAt = new Date(startsAt.getTime() + minutes * 60_000);
                const n = turn++;

                let status: SeedLesson["status"] = "scheduled";
                if (endsAt.getTime() < now.getTime()) status = n % 11 === 7 ? "no_show" : n % 7 === 3 ? "cancelled" : "completed";
                else if (n % 17 === 5) status = "cancelled";

                const needsCar = kind !== "code";
                if (needsCar && !car) continue;

                const charge = chargeLesson({
                    status,
                    minutes,
                    custom: null,
                    studentRate: null,
                    standardRate: input.rates?.[kind] ?? null,
                    hasPackage: false,
                });

                lessons.push({
                    studentId: students[n % students.length].id,
                    instructorId: instructor.id,
                    carId: needsCar ? car!.id : null,
                    kind,
                    status,
                    startsAt,
                    endsAt,
                    amount: charge.amount,
                    chargeSource: charge.source,
                    notes: `${SEED_LESSON_MARK} Leçon de démonstration.`,
                });
            }
        });
    }
    return lessons;
}

// ---------------------------------------------------------------------------
// Demo payments, so the monthly summary and the "who owes" list have something to show.
// Their note starts with "[démo]" so seed.ts can find and remove them on a re-run.

export const SEED_PAYMENT_MARK = "[démo]";

export type SeedPayment = {
    studentId: string;
    amount: number;
    paidOn: Date;
    method: "cash" | "transfer" | "cheque";
    note: string;
};

/**
 * Students pay in four ways, in turn: nothing yet, everything, about 60 %, and everything in
 * two instalments. A payment is dated on a day when the student had a lesson, never in the future.
 */
export function buildSeedPayments(input: {
    lessons: { studentId: string; status: string; amount: number | null; endsAt: Date }[];
    now: Date;
    timeZone: string;
}): SeedPayment[] {
    const byStudent = new Map<string, { total: number; days: string[] }>();
    for (const lesson of input.lessons) {
        if (lesson.status !== "completed" || lesson.amount === null || lesson.endsAt > input.now) continue;
        const entry = byStudent.get(lesson.studentId) ?? { total: 0, days: [] };
        entry.total += lesson.amount;
        entry.days.push(utcToZoned(lesson.endsAt, input.timeZone).date);
        byStudent.set(lesson.studentId, entry);
    }

    const methods = ["cash", "transfer", "cheque"] as const;
    const payments: SeedPayment[] = [];
    let turn = 0;
    for (const [studentId, { total, days }] of [...byStudent].sort((a, b) => a[0].localeCompare(b[0]))) {
        const n = turn++;
        const day = (index: number) => new Date(`${[...days].sort()[index] ?? days[0]}T00:00:00Z`);
        const round = (value: number) => Math.max(500, Math.round(value / 500) * 500);
        const method = methods[n % methods.length];
        const note = `${SEED_PAYMENT_MARK} Paiement de démonstration.`;

        switch (n % 4) {
            case 0:
                break;
            case 1:
                payments.push({ studentId, amount: round(total), paidOn: day(days.length - 1), method, note });
                break;
            case 2:
                payments.push({ studentId, amount: round(total * 0.6), paidOn: day(Math.floor(days.length / 2)), method, note });
                break;
            default: {
                const first = round(total / 2);
                payments.push({ studentId, amount: first, paidOn: day(0), method, note });
                payments.push({ studentId, amount: Math.max(500, round(total) - first), paidOn: day(days.length - 1), method: "cash", note });
            }
        }
    }
    return payments;
}

// ---------------------------------------------------------------------------
// Demo discounts. seed.ts creates one only when no discount has that name yet, so your own
// discounts are never duplicated, and gives some to demo students.

export type SeedDiscount = {
    name: string;
    kind: "percent" | "fixed";
    /** A percentage (1 to 100), or millimes for a fixed amount. */
    value: number;
    validFrom: Date | null;
    validTo: Date | null;
};

export function buildSeedDiscounts(now: Date = new Date()): SeedDiscount[] {
    const day = (offset: number) => new Date(`${addDays(now.toISOString().slice(0, 10), offset)}T00:00:00Z`);
    return [
        { name: "Réseaux sociaux", kind: "percent", value: 10, validFrom: null, validTo: null },
        { name: "Parrainage", kind: "fixed", value: 20000, validFrom: null, validTo: null },
        { name: "Offre de fin d’année", kind: "percent", value: 5, validFrom: day(-10), validTo: day(60) },
    ];
}

/** Which demo student gets which discount: about one student in four, the three offers in turn. */
export function pickDiscountRecipients(studentIds: string[], discountCount: number): { studentId: string; discountIndex: number }[] {
    const sorted = [...new Set(studentIds)].sort();
    const picks: { studentId: string; discountIndex: number }[] = [];
    sorted.forEach((studentId, i) => {
        if (i % 4 === 2) picks.push({ studentId, discountIndex: Math.floor(i / 4) % discountCount });
    });
    return picks;
}

// ---------------------------------------------------------------------------
// Demo requests from the contact form. Their message starts with "[démo]" so seed.ts can
// remove them on a re-run.

export const SEED_PROSPECT_MARK = "[démo]";

export type SeedProspect = {
    name: string;
    phone: string;
    email: string | null;
    interest: string | null;
    message: string;
    status: "received" | "contacted" | "enrolled" | "closed";
    archivedAt: Date | null;
    createdAt: Date;
};

const PROSPECT_FIRST = ["Rim", "Hamza", "Sarra", "Nizar", "Ines", "Yassine", "Amel", "Karim", "Mariem", "Oussema", "Hela", "Anis", "Dorra", "Marwen", "Nour", "Slim", "Emna", "Walid", "Ghada", "Fares"];
const PROSPECT_LAST = ["Jlassi", "Mrad", "Gharbi", "Ayari", "Zouari", "Trabelsi", "Haddad", "Ben Salah", "Mansouri", "Belhadj", "Sassi", "Khelifi", "Dridi", "Bouazizi", "Chaabane"];
const PROSPECT_MESSAGES = [
    "Je voudrais passer mon permis B cet hiver.",
    "J’ai déjà le code, il me faut seulement des leçons.",
    "Quels sont vos horaires de cours de code ?",
    "Je rappellerai plus tard, merci.",
    "Prêt à m’inscrire cette semaine.",
    "Combien coûte le forfait complet ?",
    "Est-ce que vous avez des voitures automatiques ?",
    "Je travaille la journée, avez-vous des leçons le soir ?",
    "",
    "Mon fils a 18 ans et veut commencer le code.",
];
const PROSPECT_STATUS_CYCLE: SeedProspect["status"][] = ["received", "received", "contacted", "contacted", "enrolled", "closed", "received", "contacted"];
const PROSPECT_INTERESTS = ["complet", "conduite", "code", null];

/** About 50 requests over the last two months: every status, some archived, with and without e-mail. */
export function buildSeedProspects(now: Date = new Date(), count = 50): SeedProspect[] {
    const mark = (text: string) => `${SEED_PROSPECT_MARK} ${text}`.trim();
    return Array.from({ length: count }, (_, i) => {
        const first = PROSPECT_FIRST[i % PROSPECT_FIRST.length];
        const last = PROSPECT_LAST[(i * 7) % PROSPECT_LAST.length];
        const createdAt = new Date(now.getTime() - (3 + i * 29) * 3_600_000);
        const status = PROSPECT_STATUS_CYCLE[i % PROSPECT_STATUS_CYCLE.length];
        return {
            name: `${first} ${last}`,
            phone: `${[22, 29, 50, 55, 98][i % 5]} ${String(100 + ((i * 37) % 900))} ${String(100 + ((i * 53) % 900))}`,
            email: i % 3 === 0 ? `${first.toLowerCase()}.${i}@example.invalid` : null,
            interest: PROSPECT_INTERESTS[i % PROSPECT_INTERESTS.length],
            message: mark(PROSPECT_MESSAGES[i % PROSPECT_MESSAGES.length]),
            status,
            // Every ninth request, and the old closed ones, are archived.
            archivedAt: i % 9 === 8 || (status === "closed" && i > 20) ? new Date(createdAt.getTime() + 24 * 3_600_000) : null,
            createdAt,
        };
    });
}
