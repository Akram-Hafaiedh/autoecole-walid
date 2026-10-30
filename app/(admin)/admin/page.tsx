import { requireAdmin } from "@/lib/auth";

const cards = [
  { label: "Élèves", hint: "Fiches et suivi des élèves" },
  { label: "Moniteurs", hint: "Équipe et disponibilités" },
  { label: "Véhicules", hint: "Flotte et entretien" },
  { label: "Leçons à venir", hint: "Planning sans double réservation" },
];

export default async function AdminHomePage() {
  // The layout checks too, but layouts are not re-run on every navigation.
  await requireAdmin();

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>

      <p className="mt-4 rounded-md border border-line bg-surface p-4 text-sm text-muted">
        Cette page est une coquille. La connexion par code e-mail protège
        l’accès, mais les écrans élèves, moniteurs, véhicules et planning ne
        sont pas encore construits.
      </p>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <li
            key={card.label}
            className="rounded-lg border border-line bg-surface p-5"
          >
            <p className="text-sm text-muted">{card.label}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">–</p>
            <p className="mt-2 text-xs text-muted">{card.hint}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
