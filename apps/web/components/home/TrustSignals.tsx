import Container from "@/components/ui/Container";

const stats = [
  { value: "[XXX_TRUST_DEALERS: broj]", label: "Provjereni partneri" },
  { value: "[XXX_TRUST_CUSTOMERS: broj]", label: "Zadovoljni kupci" },
  { value: "[XXX_TRUST_REVIEWS: broj]", label: "Objavljenih recenzija" },
];

export default function TrustSignals() {
  return (
    <section className="bg-brand-primary text-text-inverse py-16">
      <Container>
        <ul className="grid grid-cols-1 gap-8 text-center md:grid-cols-3">
          {stats.map((stat) => (
            <li key={stat.label}>
              <p className="text-4xl font-bold">{stat.value}</p>
              <p className="text-text-inverse mt-2 text-sm opacity-80">{stat.label}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
