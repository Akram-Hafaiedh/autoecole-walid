// What the top of a student's page shows: how much they have driven and what comes next.
// Pure functions with no database, so they can be tested on their own.

export type ProfileLesson = {
    id: string;
    kind: "driving" | "code" | "exam";
    status: "scheduled" | "completed" | "cancelled" | "no_show";
    startsAt: Date;
    endsAt: Date;
};

export type ProfileStats = {
    /** Minutes of driving lessons marked done. */
    drivingMinutes: number;
    drivingDone: number;
    codeDone: number;
    absences: number;
    /** The first planned lesson from `now` on, or null. */
    next: ProfileLesson | null;
};

export function profileStats(lessons: ProfileLesson[], now: Date): ProfileStats {
    let drivingMinutes = 0;
    let drivingDone = 0;
    let codeDone = 0;
    let absences = 0;
    let next: ProfileLesson | null = null;

    for (const lesson of lessons) {
        if (lesson.status === "completed") {
            if (lesson.kind === "driving") {
                drivingDone += 1;
                drivingMinutes += Math.round((lesson.endsAt.getTime() - lesson.startsAt.getTime()) / 60_000);
            } else if (lesson.kind === "code") codeDone += 1;
        } else if (lesson.status === "no_show") absences += 1;
        else if (lesson.status === "scheduled" && lesson.startsAt >= now) {
            if (!next || lesson.startsAt < next.startsAt) next = lesson;
        }
    }
    return { drivingMinutes, drivingDone, codeDone, absences, next };
}
