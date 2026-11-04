import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { priceUnpricedLessons, voidDiscount, voidPayment } from "@/actions/paiements";
import { PageHeader } from "@/components/admin/PageHeader";
import { GrantDiscountForm } from "@/components/paiements/GrantDiscountForm";
import { PaymentForm } from "@/components/paiements/PaymentForm";
import { StudentPricesForm } from "@/components/paiements/StudentPricesForm";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pill, type PillTone } from "@/components/ui/Pill";
import { PAYMENT_METHOD_LABELS, studentPricesToForm } from "@/lib/student-billing";
import { requireAdmin } from "@/lib/auth";
import { CHARGE_SOURCE_LABELS, accountSummary, discountAvailable } from "@/lib/billing";
import { describeDiscount } from "@/lib/discounts";
import { formatDate, isUuid } from "@/lib/format";
import { KIND_LABELS, LESSON_STATUS_LABELS, type LessonKindValue, type LessonStatusValue } from "@/lib/lessons";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { DEFAULT_MODES } from "@/lib/rates";
import { site } from "@/lib/site";
import { durationLabel, formatDayShort, formatTime, utcToZoned } from "@/lib/time";
import { btnGhost, btnSecondary, panel } from "@/lib/ui";

export const metadata: Metadata = { title: "Paiements de l’élève" };

const STATUS_TONES: Record<LessonStatusValue, PillTone> = {
    scheduled: "info",
    completed: "ok",
    cancelled: "neutral",
    no_show: "warn",
};

export default async function StudentAccountPage({ params }: { params: Promise<{ id: string }> }) {
    await requireAdmin();

    const { id } = await params;
    if (!isUuid(id)) notFound();

    const student = await prisma.student.findUnique({
        where: { id },
        include: {
            rates: true,
            discounts: { where: { voidedAt: null }, orderBy: { createdAt: "asc" } },
            payments: { orderBy: [{ paidOn: "desc" }, { createdAt: "desc" }] },
            lessons: { orderBy: { startsAt: "desc" } },
        },
    });
    if (!student) notFound();

    const allDiscounts = await prisma.discount.findMany({ orderBy: { name: "asc" } });
    const today = new Date();
    const todayDate = utcToZoned(today, site.timeZone).date;

    const livePayments = student.payments.filter((payment) => !payment.voidedAt);
    const summary = accountSummary({
        packageTotal: student.packageTotal,
        lessons: student.lessons,
        discounts: student.discounts,
        payments: livePayments.map((payment) => payment.amount),
    });

    const givenIds = new Set(student.discounts.map((discount) => discount.discountId));
    const available = allDiscounts
        .filter((discount) => discountAvailable(discount, today) && !givenIds.has(discount.id))
        .map((discount) => ({ id: discount.id, label: `${discount.name} (${describeDiscount(discount.kind, discount.value)})` }));

    const owes = summary.balance > 0;
    const settled = summary.balance === 0;

    return (
        <>
            <PageHeader
                back={{ href: `/admin/eleves/${student.id}`, label: "Fiche de l’élève" }}
                leading={<Avatar id={student.id} firstName={student.firstName} lastName={student.lastName} size="lg" />}
                title={`Paiements de ${student.firstName} ${student.lastName}`}
                description="Ce que l’élève doit, ce qu’il a payé, ses remises, ses prix particuliers et ses leçons."
            />

            <div className="grid max-w-4xl gap-10">
                <section aria-label="Résumé" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Figure label="Facturé" value={formatMoney(summary.charges)} />
                    <Figure label="Remises" value={summary.discount > 0 ? formatMoney(-summary.discount) : formatMoney(0)} />
                    <Figure label="Payé" value={formatMoney(summary.paid)} />
                    <Figure
                        label={owes ? "Reste à payer" : settled ? "Solde" : "Payé en trop"}
                        value={formatMoney(Math.abs(summary.balance))}
                        tone={owes ? "warn" : settled ? "ok" : "info"}
                    />
                </section>

                {student.packageTotal !== null && (
                    <p className="-mt-6 text-sm text-muted">
                        Prix total convenu : {formatMoney(student.packageTotal)}. Les leçons faites sont incluses dans ce
                        prix.
                    </p>
                )}

                {summary.unpriced > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warn-fg/30 bg-warn-bg px-4 py-3 text-sm text-warn-fg">
                        <p>
                            {summary.unpriced} leçon{summary.unpriced > 1 ? "s" : ""} effectuée{summary.unpriced > 1 ? "s" : ""}{" "}
                            sans prix, car aucun tarif n’existait à ce moment-là. Définissez les tarifs, puis calculez-les.
                        </p>
                        <form action={priceUnpricedLessons.bind(null, student.id)}>
                            <button type="submit" className={btnSecondary}>
                                Calculer les prix manquants
                            </button>
                        </form>
                    </div>
                )}

                <section aria-labelledby="payments-title">
                    <h2 id="payments-title" className="font-display text-xl font-semibold">
                        Paiements
                    </h2>
                    <div className={`${panel} mt-4 p-5 sm:p-6`}>
                        <PaymentForm
                            studentId={student.id}
                            initial={{ amount: "", paidOn: todayDate, method: "cash", note: "" }}
                        />
                    </div>

                    {student.payments.length > 0 && (
                        <ul className={`${panel} mt-4 divide-y divide-line`}>
                            {student.payments.map((payment) => (
                                <li key={payment.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4 sm:px-6">
                                    <div className={`min-w-0 flex-1 ${payment.voidedAt ? "text-muted line-through" : ""}`}>
                                        <p className="font-medium tabular-nums">{formatMoney(payment.amount)}</p>
                                        <p className="text-sm text-muted">
                                            {formatDate(payment.paidOn)} · {PAYMENT_METHOD_LABELS[payment.method]}
                                            {payment.note ? ` · ${payment.note}` : ""}
                                        </p>
                                    </div>
                                    {payment.voidedAt ? (
                                        <Pill tone="neutral">Annulé</Pill>
                                    ) : (
                                        <form action={voidPayment.bind(null, payment.id)}>
                                            <button type="submit" className={btnGhost}>
                                                Annuler
                                            </button>
                                        </form>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section aria-labelledby="discounts-title">
                    <h2 id="discounts-title" className="font-display text-xl font-semibold">
                        Remises
                    </h2>
                    <p className="mt-1 mb-4 text-sm text-muted">
                        Les remises sont retirées du total facturé. Pour en créer une nouvelle (réseaux sociaux, fêtes…),
                        allez dans <Link href="/admin/tarifs" className="underline underline-offset-2">Tarifs</Link>.
                    </p>
                    <div className={`${panel} p-5 sm:p-6`}>
                        {student.discounts.length > 0 && (
                            <ul className="mb-5 divide-y divide-line">
                                {student.discounts.map((discount) => (
                                    <li key={discount.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0">
                                        <p className="min-w-0 flex-1 font-medium">
                                            {discount.label}
                                            <span className="ml-2 font-display font-bold tabular-nums">
                                                {describeDiscount(discount.kind, discount.value)}
                                            </span>
                                        </p>
                                        <form action={voidDiscount.bind(null, discount.id)}>
                                            <button type="submit" className={btnGhost}>
                                                Retirer
                                            </button>
                                        </form>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {available.length > 0 ? (
                            <GrantDiscountForm studentId={student.id} options={available} />
                        ) : (
                            <p className="text-sm text-muted">Aucune remise disponible à accorder pour le moment.</p>
                        )}
                    </div>
                </section>

                <section aria-labelledby="prices-title">
                    <h2 id="prices-title" className="font-display text-xl font-semibold">
                        Prix convenus avec cet élève
                    </h2>
                    <p className="mt-1 mb-4 text-sm text-muted">
                        Un prix total pour tout le permis, ou un prix particulier par type de leçon. Ils remplacent le
                        tarif habituel, sans modifier les leçons déjà facturées.
                    </p>
                    <StudentPricesForm
                        studentId={student.id}
                        initial={studentPricesToForm(student.packageTotal, student.rates, DEFAULT_MODES)}
                    />
                </section>

                <section aria-labelledby="history-title">
                    <h2 id="history-title" className="font-display text-xl font-semibold">
                        Leçons
                    </h2>
                    {student.lessons.length === 0 ? (
                        <div className={`${panel} mt-4`}>
                            <EmptyState icon="coins">Aucune leçon pour cet élève.</EmptyState>
                        </div>
                    ) : (
                        <ul className={`${panel} mt-4 divide-y divide-line`}>
                            {student.lessons.map((lesson) => {
                                const start = utcToZoned(lesson.startsAt, site.timeZone);
                                const minutes = Math.round((lesson.endsAt.getTime() - lesson.startsAt.getTime()) / 60_000);
                                const status = lesson.status as LessonStatusValue;
                                return (
                                    <li key={lesson.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4 sm:px-6">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium">
                                                <Link href={`/admin/planning/${lesson.id}`} className="hover:underline">
                                                    {formatDayShort(start.date)} · {formatTime(start.minutes)}
                                                </Link>
                                                <span className="ml-2 text-sm font-normal text-muted">
                                                    {KIND_LABELS[lesson.kind as LessonKindValue]} · {durationLabel(minutes)}
                                                </span>
                                            </p>
                                            {lesson.chargeSource && (
                                                <p className="text-sm text-muted">{CHARGE_SOURCE_LABELS[lesson.chargeSource]}</p>
                                            )}
                                        </div>
                                        <Pill tone={STATUS_TONES[status]}>{LESSON_STATUS_LABELS[status]}</Pill>
                                        <p className="w-28 text-right font-medium tabular-nums">
                                            {lesson.amount !== null ? formatMoney(lesson.amount) : "—"}
                                        </p>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            </div>
        </>
    );
}

function Figure({ label, value, tone }: { label: string; value: string; tone?: PillTone }) {
    const color = tone === "warn" ? "text-warn-fg" : tone === "ok" ? "text-ok-fg" : tone === "info" ? "text-info-fg" : "";
    return (
        <div className={`${panel} p-4`}>
            <p className="text-xs font-medium text-muted">{label}</p>
            <p className={`mt-1 font-display text-xl font-bold tabular-nums ${color}`}>{value}</p>
        </div>
    );
}
