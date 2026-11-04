import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { archiveStudent, restoreStudent, updateStudent } from "@/actions/students";
import { PageHeader } from "@/components/admin/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { StatusPill } from "@/components/students/StatusPill";
import { StudentForm } from "@/components/students/StudentForm";
import { StudentOverview } from "@/components/students/StudentOverview";
import { requireAdmin } from "@/lib/auth";
import { accountSummary } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { profileStats } from "@/lib/profile";
import { formatDate, isUuid, toDateInput } from "@/lib/format";
import { btnGhost, btnPrimary, btnSecondary } from "@/lib/ui";
import type { StudentStatusValue } from "@/lib/students";

export const metadata: Metadata = { title: "Fiche élève" };

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
    await requireAdmin();

    const { id } = await params;
    if (!isUuid(id)) notFound();

    const student = await prisma.student.findUnique({
        where: { id },
        include: {
            lessons: {
                select: { id: true, kind: true, status: true, startsAt: true, endsAt: true, amount: true, instructor: { select: { firstName: true, lastName: true } } },
                orderBy: { startsAt: "asc" },
            },
            payments: { where: { voidedAt: null }, select: { amount: true } },
            discounts: { where: { voidedAt: null }, select: { kind: true, value: true } },
        },
    });
    if (!student) notFound();

    const stats = profileStats(student.lessons, new Date());
    const nextInstructor = stats.next ? student.lessons.find((lesson) => lesson.id === stats.next!.id)?.instructor : undefined;
    const { balance } = accountSummary({
        packageTotal: student.packageTotal,
        lessons: student.lessons,
        discounts: student.discounts,
        payments: student.payments.map((payment) => payment.amount),
    });

    return (
        <>
            <PageHeader
                back={{ href: "/admin/eleves", label: "Élèves" }}
                leading={
                    <Avatar id={student.id} firstName={student.firstName} lastName={student.lastName} size="lg" />
                }
                title={`${student.firstName} ${student.lastName}`}
                actions={
                    <>
                        <Link href={`/admin/eleves/${student.id}/paiements`} className={btnSecondary}>
                            Paiements et leçons
                        </Link>
                        {student.status === "archived" ? (
                            <form action={restoreStudent.bind(null, student.id)}>
                                <button type="submit" className={btnPrimary}>
                                    Restaurer
                                </button>
                            </form>
                        ) : (
                            <form action={archiveStudent.bind(null, student.id)}>
                                <button type="submit" className={btnGhost}>
                                    Archiver
                                </button>
                            </form>
                        )}
                    </>
                }
                description={
                    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
                        <StatusPill status={student.status as StudentStatusValue} />
                        <span>Inscrit le {formatDate(student.createdAt)}</span>
                    </span>
                }
            />
            <StudentOverview
                studentId={student.id}
                stats={stats}
                balance={balance}
                nextInstructor={nextInstructor ? `${nextInstructor.firstName} ${nextInstructor.lastName}` : null}
            />
            <StudentForm
                action={updateStudent.bind(null, student.id)}
                submitLabel="Enregistrer"
                initial={{
                    firstName: student.firstName,
                    lastName: student.lastName,
                    phone: student.phone ?? "",
                    email: student.email ?? "",
                    birthDate: toDateInput(student.birthDate),
                    nationalId: student.nationalId ?? "",
                    licenceCategory: student.licenceCategory,
                    status: student.status,
                    notes: student.notes ?? "",
                }}
            />
        </>
    );
}
