// Fake students for trying out the admin screens. Pure data, no database access,
// so it can be tested on its own. Every name, phone number and email is invented.
//
// Every seeded student has a national ID starting with "SEED-". That is how
// seed.ts finds and replaces them on a re-run, and how you can remove them by hand:
//   DELETE FROM students WHERE national_id LIKE 'SEED-%';

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
// Demo lessons: this week and next, so the planning has something to show.
// Notes start with "[démo]" so seed.ts can find and replace them on a re-run.

export const SEED_LESSON_MARK = "[démo]";

export type SeedLesson = {
    studentId: string;
    instructorId: string;
    carId: string | null;
    kind: "driving" | "code";
    status: "scheduled" | "completed" | "cancelled" | "no_show";
    startsAt: Date;
    endsAt: Date;
    notes: string;
};

type Slot = readonly [start: string, minutes: number, kind: "driving" | "code"];

// A day for one instructor: start time, length in minutes, type. Short and long lessons,
// early starts, an evening, back-to-back lessons and a full 8-hour day all appear.
const DAYS: Record<string, readonly Slot[]> = {
    regular: [["08:00", 120, "driving"], ["10:30", 60, "driving"], ["14:00", 180, "driving"]],
    early: [["06:00", 120, "driving"], ["09:00", 120, "code"], ["16:00", 240, "driving"]],
    long: [["09:00", 480, "driving"]],
    short: [["08:00", 60, "driving"], ["09:00", 60, "driving"], ["10:00", 60, "driving"], ["18:00", 120, "driving"]],
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
}): SeedLesson[] {
    const { now, timeZone } = input;
    const students = input.students.filter((student) => student.status !== "archived");
    const team = input.instructors.slice(0, 3);
    if (students.length === 0 || team.length === 0) return [];

    const today = utcToZoned(now, timeZone).date;
    const start = weekStart(today);
    const lessons: SeedLesson[] = [];
    let turn = 0;

    for (let offset = 0; offset < 14; offset++) {
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

                const needsCar = kind === "driving";
                if (needsCar && !car) continue;

                lessons.push({
                    studentId: students[n % students.length].id,
                    instructorId: instructor.id,
                    carId: needsCar ? car!.id : null,
                    kind,
                    status,
                    startsAt,
                    endsAt,
                    notes: `${SEED_LESSON_MARK} Leçon de démonstration.`,
                });
            }
        });
    }
    return lessons;
}

