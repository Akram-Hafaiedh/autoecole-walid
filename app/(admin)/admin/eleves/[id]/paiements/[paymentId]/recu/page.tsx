import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { PrintButton } from "@/components/paiements/PrintButton";
import { PAYMENT_METHOD_LABELS } from "@/lib/student-billing";
import { amountInWords } from "@/lib/amount-words";
import { requireAdmin } from "@/lib/auth";
import { accountSummary } from "@/lib/billing";
import { formatDate, isUuid } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { site } from "@/lib/site";
import { utcToZoned } from "@/lib/time";

export const metadata: Metadata = { title: "Reçu de paiement" };

export default async function ReceiptPage({ params }: { params: Promise<{ id: string; paymentId: string }> }) {
    await requireAdmin();

    const { id, paymentId } = await params;
    if (!isUuid(id) || !isUuid(paymentId)) notFound();

    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
            student: {
                include: {
                    lessons: { where: { status: { in: ["completed", "no_show"] } }, select: { status: true, amount: true } },
                    discounts: { where: { voidedAt: null }, select: { kind: true, value: true } },
                    payments: { where: { voidedAt: null }, select: { amount: true } },
                },
            },
        },
    });
    if (!payment || payment.studentId !== id) notFound();

    const { student } = payment;
    const summary = accountSummary({
        packageTotal: student.packageTotal,
        lessons: student.lessons,
        discounts: student.discounts,
        payments: student.payments.map((row) => row.amount),
    });
    const today = utcToZoned(new Date(), site.timeZone).date;
    const reference = `R-${payment.id.slice(0, 8).toUpperCase()}`;
    const cancelled = payment.voidedAt !== null;

    return (
        <>
            <div className="print:hidden">
                <PageHeader
                    back={{ href: `/admin/eleves/${student.id}/paiements`, label: "Paiements de l’élève" }}
                    title="Reçu de paiement"
                    description="Vérifiez le reçu, puis imprimez-le ou enregistrez-le en PDF depuis la fenêtre d’impression."
                    actions={cancelled ? undefined : <PrintButton />}
                />
            </div>

            {/* Always black on white, whatever the theme: it is meant for paper. */}
            <article
                aria-label={`Reçu ${reference}`}
                className="relative mx-auto max-w-2xl rounded-2xl border border-line bg-white p-8 text-black shadow-card print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none sm:p-10"
            >
                {cancelled && (
                    <p className="mb-6 rounded-lg border-2 border-red-700 px-4 py-2 text-center text-lg font-bold tracking-widest text-red-700 uppercase">
                        Paiement annulé
                    </p>
                )}

                <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-black pb-5">
                    <div>
                        <h1 className="font-display text-2xl font-bold">{site.name}</h1>
                        <p className="mt-1 text-sm">{site.address.join(", ")}</p>
                        <p className="text-sm">Tél. {site.phone.display}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-display text-xl font-bold uppercase">Reçu</p>
                        <p className="text-sm tabular-nums">N° {reference}</p>
                        <p className="text-sm">{formatDate(payment.paidOn)}</p>
                    </div>
                </header>

                <dl className="mt-6 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[10rem_1fr]">
                    <dt className="font-medium">Reçu de</dt>
                    <dd className="text-base font-semibold">
                        {student.firstName} {student.lastName}
                    </dd>
                    <dt className="font-medium">Montant</dt>
                    <dd className="font-display text-2xl font-bold tabular-nums">{formatMoney(payment.amount)}</dd>
                    <dt className="font-medium">Arrêté à la somme de</dt>
                    <dd>{amountInWords(payment.amount)}</dd>
                    <dt className="font-medium">Mode de paiement</dt>
                    <dd>{PAYMENT_METHOD_LABELS[payment.method]}</dd>
                    {payment.note && (
                        <>
                            <dt className="font-medium">Objet</dt>
                            <dd>{payment.note}</dd>
                        </>
                    )}
                </dl>

                <section aria-label="Situation" className="mt-8 rounded-lg border border-black/30 p-4 text-sm">
                    <p className="mb-2 font-medium">Situation au {formatDate(new Date(`${today}T00:00:00Z`))}</p>
                    <div className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 tabular-nums">
                        <span>Total facturé</span>
                        <span className="text-right">{formatMoney(summary.charges)}</span>
                        {summary.discount > 0 && (
                            <>
                                <span>Remises</span>
                                <span className="text-right">{formatMoney(-summary.discount)}</span>
                            </>
                        )}
                        <span>Total payé</span>
                        <span className="text-right">{formatMoney(summary.paid)}</span>
                        <span className="font-semibold">{summary.balance < 0 ? "Payé en trop" : "Reste à payer"}</span>
                        <span className="text-right font-semibold">{formatMoney(Math.abs(summary.balance))}</span>
                    </div>
                </section>

                <footer className="mt-10 flex justify-between gap-6 text-sm">
                    <p>Fait le {formatDate(payment.paidOn)}</p>
                    <div className="w-48 text-center">
                        <p>Signature et cachet</p>
                        <div className="mt-14 border-t border-black" />
                    </div>
                </footer>
            </article>
        </>
    );
}
