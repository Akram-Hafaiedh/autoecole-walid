// Layout rules for the planning week view. Pure, no imports, so it can be tested on its own.

/** The grid shows at least these hours, and grows when a lesson falls outside them. */
export const DEFAULT_START_HOUR = 6;
export const DEFAULT_END_HOUR = 21;

export type PlannedLesson = {
    id: string;
    /** "2026-10-31", the day at the school. */
    date: string;
    startMin: number;
    endMin: number;
    kind: "driving" | "code" | "exam" | "refresher";
    status: "scheduled" | "completed" | "cancelled" | "no_show";
    studentName: string;
    instructorId: string;
    instructorName: string;
    carLabel: string | null;
};

export type Positioned<T> = T & {
    /** Column inside the day: 0 is the left-most. */
    lane: number;
    /** How many columns the day is split into around this lesson. */
    lanes: number;
};

/**
 * Places lessons that overlap in time side by side, so none hides another. Lessons that only
 * touch (one ends at 10:00, the next starts at 10:00) do not count as overlapping. Lessons
 * that overlap in a chain share the same number of columns.
 */
export function layoutLanes<T extends { startMin: number; endMin: number }>(items: T[]): Positioned<T>[] {
    const sorted = [...items].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
    const result: Positioned<T>[] = [];

    let cluster: Positioned<T>[] = [];
    let laneEnds: number[] = [];
    let clusterEnd = -1;

    const close = () => {
        for (const item of cluster) item.lanes = laneEnds.length;
        result.push(...cluster);
        cluster = [];
        laneEnds = [];
    };

    for (const item of sorted) {
        if (cluster.length > 0 && item.startMin >= clusterEnd) close();

        let lane = laneEnds.findIndex((end) => end <= item.startMin);
        if (lane === -1) {
            lane = laneEnds.length;
            laneEnds.push(item.endMin);
        } else {
            laneEnds[lane] = item.endMin;
        }

        cluster.push({ ...item, lane, lanes: 1 });
        clusterEnd = Math.max(clusterEnd, item.endMin);
    }
    close();

    return result;
}

/** First and last whole hour to draw: the default range, widened to fit every lesson. */
export function hourRange(items: { startMin: number; endMin: number }[]): { startHour: number; endHour: number } {
    let startHour = DEFAULT_START_HOUR;
    let endHour = DEFAULT_END_HOUR;
    for (const item of items) {
        startHour = Math.min(startHour, Math.floor(item.startMin / 60));
        endHour = Math.max(endHour, Math.ceil(item.endMin / 60));
    }
    return { startHour, endHour };
}

/** The planning URL, keeping the view, the day or week, and the filters. */
export function planningHref(params: {
    /** Any date of the week to show (week view). */
    semaine?: string;
    /** "jour" for the day view: one column per instructor. */
    vue?: "jour";
    /** The day to show (day view). */
    jour?: string;
    moniteur?: string;
    vehicule?: string;
    annulees?: boolean;
}): string {
    const query = new URLSearchParams();
    if (params.vue === "jour") {
        query.set("vue", "jour");
        if (params.jour) query.set("jour", params.jour);
    } else if (params.semaine) {
        query.set("semaine", params.semaine);
    }
    if (params.moniteur) query.set("moniteur", params.moniteur);
    if (params.vehicule) query.set("vehicule", params.vehicule);
    if (params.annulees) query.set("annulees", "1");
    const text = query.toString();
    return text ? `/admin/planning?${text}` : "/admin/planning";
}

/** The "new lesson" URL, with the day and the filters already filled in. */
export function newLessonHref(params: { date?: string; moniteur?: string; vehicule?: string }): string {
    const query = new URLSearchParams();
    if (params.date) query.set("date", params.date);
    if (params.moniteur) query.set("moniteur", params.moniteur);
    if (params.vehicule) query.set("vehicule", params.vehicule);
    const text = query.toString();
    return text ? `/admin/planning/nouveau?${text}` : "/admin/planning/nouveau";
}
