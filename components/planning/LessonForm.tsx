"use client";

import Link from "next/link";
import { useState } from "react";
import { kindStyles } from "@/components/planning/lessonStyles";
import { Field, FormError, Section } from "@/components/ui/FormParts";
import { useFormFields } from "@/components/ui/useFormFields";
import {
    DURATION_PRESETS,
    KIND_LABELS,
    LESSON_KINDS,
    LESSON_STATUSES,
    LESSON_STATUS_LABELS,
    MAX_DURATION,
    MIN_DURATION,
    endMinutes,
    type LessonField,
    type LessonFormState,
    type LessonKindValue,
} from "@/lib/lessons";
import { PRICE_MODE_LABELS } from "@/lib/billing";
import { site } from "@/lib/site";
import { durationLabel, formatTime } from "@/lib/time";
import { btnPrimary, btnSecondary, input } from "@/lib/ui";

type Option = { id: string; label: string };

type Props = {
    action: (state: LessonFormState, formData: FormData) => Promise<LessonFormState>;
    initial: Record<LessonField, string>;
    students: Option[];
    instructors: Option[];
    cars: Option[];
    /** Edit mode adds the status field. */
    withStatus?: boolean;
    submitLabel: string;
    cancelHref: string;
    /** In edit mode, a sentence saying what the lesson is billed. */
    billing?: string;
};

export function LessonForm({
    action,
    initial,
    students,
    instructors,
    cars,
    withStatus = false,
    submitLabel,
    cancelHref,
    billing,
}: Props) {
    const { state, formAction, pending, error, props } = useFormFields(action, initial);

    // The fields that react to each other are kept in state: the car field depends on the type,
    // and the end time depends on the start time and the duration.
    const [kind, setKind] = useState(state.values?.kind ?? initial.kind);
    const [date, setDate] = useState(initial.date);
    const [time, setTime] = useState(initial.time);
    const [duration, setDuration] = useState(initial.duration);
    const [priceMode, setPriceMode] = useState(state.values?.priceMode ?? initial.priceMode);

    const end = endMinutes(time, duration);
    const minutes = Number(duration);
    const crossesMidnight = end !== null && end > 1440;
    const durationValid = /^\d+$/.test(duration) && minutes >= MIN_DURATION && minutes <= MAX_DURATION;

    return (
        <form action={formAction} className="flex max-w-3xl flex-col gap-6">
            {state.message && <FormError>{state.message}</FormError>}

            <Section title="Qui">
                <Field name="studentId" label="Élève" error={error("studentId")}>
                    <select {...props("studentId")} required>
                        <option value="">Choisir un élève…</option>
                        {students.map((student) => (
                            <option key={student.id} value={student.id}>
                                {student.label}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field name="instructorId" label="Moniteur" error={error("instructorId")}>
                    <select {...props("instructorId")} required>
                        <option value="">Choisir un moniteur…</option>
                        {instructors.map((instructor) => (
                            <option key={instructor.id} value={instructor.id}>
                                {instructor.label}
                            </option>
                        ))}
                    </select>
                </Field>
            </Section>

            <Section title="Quand">
                <Field name="date" label="Date" error={error("date")}>
                    <input
                        {...props("date", true)}
                        type="date"
                        required
                        value={date}
                        onChange={(event) => setDate(event.target.value)}
                    />
                </Field>
                <Field name="time" label="Heure de début" error={error("time")}>
                    <input
                        {...props("time", true)}
                        type="time"
                        required
                        step={300}
                        value={time}
                        onChange={(event) => setTime(event.target.value)}
                    />
                </Field>

                <div className="flex flex-col gap-2.5 sm:col-span-2">
                    <span id="duration-label" className="text-sm font-medium">
                        Durée
                    </span>
                    <div role="group" aria-labelledby="duration-label" className="flex flex-wrap gap-2">
                        {DURATION_PRESETS.map((preset) => (
                            <button
                                key={preset}
                                type="button"
                                aria-pressed={duration === String(preset)}
                                onClick={() => setDuration(String(preset))}
                                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand ${duration === String(preset)
                                        ? "border-brand bg-brand-soft text-brand-ink"
                                        : "border-line-strong bg-surface text-foreground hover:bg-surface-2"
                                    }`}
                            >
                                {durationLabel(preset)}
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <label htmlFor="duration" className="flex items-center gap-2 text-sm whitespace-nowrap text-muted">
                            Autre durée
                            <input
                                {...props("duration", true)}
                                type="number"
                                inputMode="numeric"
                                min={MIN_DURATION}
                                max={MAX_DURATION}
                                step={5}
                                required
                                value={duration}
                                onChange={(event) => setDuration(event.target.value)}
                                className={`${input} w-24 aria-invalid:border-danger`}
                            />
                            minutes
                        </label>
                        {durationValid && end !== null && (
                            <p className={`text-sm tabular-nums ${crossesMidnight ? "font-medium text-danger" : "text-muted"}`}>
                                {crossesMidnight
                                    ? "Dépasse minuit : raccourcissez la leçon."
                                    : `Fin à ${formatTime(end)} · ${durationLabel(minutes)}`}
                            </p>
                        )}
                    </div>
                    {error("duration") && (
                        <p id="duration-error" className="text-xs font-medium text-danger">
                            {error("duration")}
                        </p>
                    )}
                </div>
            </Section>

            <Section title="Détails">
                <fieldset className="sm:col-span-2">
                    <legend className="mb-1.5 text-sm font-medium">Type de leçon</legend>
                    <div className="flex flex-wrap gap-2">
                        {LESSON_KINDS.map((value: LessonKindValue) => (
                            <label key={value} className="cursor-pointer">
                                <input
                                    type="radio"
                                    name="kind"
                                    value={value}
                                    checked={kind === value}
                                    onChange={() => setKind(value)}
                                    className="peer sr-only"
                                />
                                <span className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-3.5 py-1.5 text-sm font-medium transition-colors peer-checked:border-brand peer-checked:bg-brand-soft peer-checked:text-brand-ink peer-focus-visible:outline-2 peer-focus-visible:outline-brand">
                                    <span aria-hidden="true" className={`size-2 rounded-full ${kindStyles[value].dot}`} />
                                    {KIND_LABELS[value]}
                                </span>
                            </label>
                        ))}
                    </div>
                    {error("kind") && <p className="mt-1.5 text-xs font-medium text-danger">{error("kind")}</p>}
                </fieldset>

                {kind === "code" ? (
                    <p className="rounded-xl bg-surface-2 px-4 py-3 text-sm text-muted sm:col-span-2">
                        Une leçon de code n’utilise pas de véhicule.
                    </p>
                ) : (
                    <Field
                        name="carId"
                        label="Véhicule"
                        error={error("carId")}
                        hint={kind === "exam" ? "Facultatif pour un examen." : undefined}
                    >
                        <select {...props("carId")} required={kind === "driving"}>
                            <option value="">Choisir un véhicule…</option>
                            {cars.map((car) => (
                                <option key={car.id} value={car.id}>
                                    {car.label}
                                </option>
                            ))}
                        </select>
                    </Field>
                )}

                {withStatus && (
                    <Field name="status" label="Statut" error={error("status")}>
                        <select {...props("status")}>
                            {LESSON_STATUSES.map((value) => (
                                <option key={value} value={value}>
                                    {LESSON_STATUS_LABELS[value]}
                                </option>
                            ))}
                        </select>
                    </Field>
                )}

                <Field name="notes" label="Notes" error={error("notes")} full>
                    <textarea {...props("notes")} rows={3} maxLength={2000} />
                </Field>
            </Section>

            <Section
                title="Prix"
                description={
                    billing ??
                    "Le prix est calculé quand la leçon est marquée « Effectuée », avec le tarif habituel ou celui convenu avec l’élève."
                }
            >
                <Field
                    name="priceMode"
                    label="Prix de cette leçon"
                    error={error("priceMode")}
                    hint="Choisissez un prix particulier seulement si cette leçon fait exception."
                >
                    <select
                        {...props("priceMode", true)}
                        value={priceMode}
                        onChange={(event) => setPriceMode(event.target.value)}
                    >
                        <option value="">Tarif habituel (automatique)</option>
                        <option value="per_session">Prix fixe pour cette leçon</option>
                        <option value="per_hour">Prix à l’heure pour cette leçon</option>
                    </select>
                </Field>
                {priceMode !== "" && (
                    <Field
                        name="price"
                        label={`${priceMode === "per_hour" ? "Prix de l’heure" : "Prix de la leçon"} (${site.currency})`}
                        error={error("price")}
                        hint={priceMode === "per_hour" ? `Montant ${PRICE_MODE_LABELS.per_hour}, multiplié par la durée.` : undefined}
                    >
                        <input {...props("price")} type="text" inputMode="decimal" required autoComplete="off" maxLength={12} />
                    </Field>
                )}
            </Section>

            <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={pending} className={btnPrimary}>
                    {pending ? "Enregistrement…" : submitLabel}
                </button>
                <Link href={cancelHref} className={btnSecondary}>
                    Annuler
                </Link>
            </div>
        </form>
    );
}
