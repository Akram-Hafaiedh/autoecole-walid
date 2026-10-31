import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusPill, STATUS_DOT } from "@/components/students/StatusPill";
import { StudentAvatar } from "@/components/students/StudentAvatar";
import { Icon } from "@/components/ui/Icon";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STATUS_LABELS, STUDENT_STATUSES, formatDate, type StudentStatusValue } from "@/lib/students";
import { btnPrimary, panel } from "@/lib/ui";

function today(): string {
  const text = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default async function AdminHomePage() {
  // The layout checks too, but layouts are not re-run on every navigation.
  await requireAdmin();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [grouped, newThisMonth, recent] = await Promise.all([
    prisma.student.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.student.count({ where: { createdAt: { gte: monthStart }, status: { not: "archived" } } }),
    prisma.student.findMany({
      where: { status: { not: "archived" } },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        licenceCategory: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  const counts = Object.fromEntries(STUDENT_STATUSES.map((status) => [status, 0])) as Record<
    StudentStatusValue,
    number
  >;
  for (const row of grouped) counts[row.status as StudentStatusValue] = row._count._all;
  const total = STUDENT_STATUSES.reduce((sum, status) => sum + counts[status], 0);

  const stats = [
    { label: "Élèves actifs", value: counts.active, dot: STATUS_DOT.active, href: "/admin/eleves?statut=active" },
    { label: "En pause", value: counts.paused, dot: STATUS_DOT.paused, href: "/admin/eleves?statut=paused" },
    { label: "Terminés", value: counts.completed, dot: STATUS_DOT.completed, href: "/admin/eleves?statut=completed" },
    { label: "Inscrits ce mois-ci", value: newThisMonth, dot: "bg-foreground/30", href: undefined },
  ];

  return (
    <>
      <PageHeader
        title="Bonjour"
        description={today()}
        actions={
          <Link href="/admin/eleves/nouveau" className={btnPrimary}>
            <Icon name="plus" className="size-4" />
            Nouvel élève
          </Link>
        }
      />

      <section
        aria-label="Chiffres clés"
        className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4"
      >
        {stats.map((stat) => {
          const body = (
            <>
              <p className="flex items-center gap-2 text-sm text-muted">
                <span aria-hidden="true" className={`size-2 rounded-full ${stat.dot}`} />
                {stat.label}
              </p>
              <p className="mt-3 font-display text-4xl font-bold tracking-tight tabular-nums">
                {stat.value}
              </p>
            </>
          );
          return stat.href ? (
            <Link
              key={stat.label}
              href={stat.href}
              className="bg-surface p-5 transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
            >
              {body}
            </Link>
          ) : (
            <div key={stat.label} className="bg-surface p-5">
              {body}
            </div>
          );
        })}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section className={`${panel} min-w-0`}>
          <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-3">
            <h2 className="font-display text-lg font-semibold">Derniers inscrits</h2>
            <Link href="/admin/eleves" className="text-sm font-medium text-brand hover:underline">
              Voir tous les élèves
            </Link>
          </div>

          {recent.length === 0 ? (
            <p className="px-5 pb-6 text-sm text-muted">
              Aucun élève pour l’instant. Ajoutez le premier avec « Nouvel élève ».
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((student) => (
                <li key={student.id}>
                  <Link
                    href={`/admin/eleves/${student.id}`}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-2"
                  >
                    <StudentAvatar id={student.id} firstName={student.firstName} lastName={student.lastName} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {student.firstName} {student.lastName}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        Permis {student.licenceCategory} · inscrit le {formatDate(student.createdAt, "short")}
                      </span>
                    </span>
                    <span className="hidden sm:block">
                      <StatusPill status={student.status as StudentStatusValue} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex min-w-0 flex-col gap-6">
          <section className={`${panel} p-5`}>
            <h2 className="font-display text-lg font-semibold">Répartition</h2>
            <p className="mt-0.5 text-sm text-muted tabular-nums">
              {total} élève{total > 1 ? "s" : ""} au total
            </p>

            {total > 0 && (
              <div
                role="img"
                aria-label="Répartition des élèves par statut"
                className="mt-4 flex h-3 gap-0.5 overflow-hidden rounded-full"
              >
                {STUDENT_STATUSES.filter((status) => counts[status] > 0).map((status) => (
                  <span
                    key={status}
                    className={STATUS_DOT[status]}
                    style={{ width: `${(counts[status] / total) * 100}%` }}
                  />
                ))}
              </div>
            )}

            <ul className="mt-4 space-y-2.5">
              {STUDENT_STATUSES.map((status) => (
                <li key={status} className="flex items-center gap-2.5 text-sm">
                  <span aria-hidden="true" className={`size-2.5 rounded-full ${STATUS_DOT[status]}`} />
                  <span className="flex-1">{STATUS_LABELS[status]}</span>
                  <span className="font-medium tabular-nums">{counts[status]}</span>
                  <span className="w-10 text-right text-muted tabular-nums">
                    {total > 0 ? Math.round((counts[status] / total) * 100) : 0} %
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className={`${panel} p-5`}>
            <h2 className="font-display text-lg font-semibold">Prochaines leçons</h2>
            <div className="mt-4 flex items-start gap-3 rounded-xl bg-surface-2 p-4">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-ink">
                <Icon name="calendar" className="size-5" />
              </span>
              <p className="text-sm text-muted">
                Le planning n’est pas encore disponible. Les leçons de la semaine s’afficheront ici avec
                leur moniteur et leur véhicule.
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
