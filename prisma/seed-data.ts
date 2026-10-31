// Fake students for trying out the admin screens. Pure data, no database access,
// so it can be tested on its own. Every name, phone number and email is invented.
//
// Every seeded student has a national ID starting with "SEED-". That is how
// seed.ts finds and replaces them on a re-run, and how you can remove them by hand:
//   DELETE FROM students WHERE national_id LIKE 'SEED-%';

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
