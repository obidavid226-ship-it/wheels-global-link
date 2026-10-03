import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  MessageCircle,
  Scale,
  Ship,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageIntro, SectionHeading } from "@/components/marketplace";
import { vehicles } from "@/lib/inventory";
import {
  buildQuoteMessage,
  comparisonGroups,
  getComparisonHighlights,
} from "@/lib/vehicle-comparison";
import image from "@/assets/awa-cars-category.jpg";

export const Route = createFileRoute("/compare")({
  validateSearch: (search) => ({ ids: typeof search.ids === "string" ? search.ids : "" }),
  head: () => ({
    meta: [
      { title: "Compare Vehicles | AWA AUTO MALL" },
      {
        name: "description",
        content:
          "Compare detailed vehicle specifications, sourcing considerations, and purchase planning notes through AWA AUTO MALL.",
      },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const { ids } = Route.useSearch();
  const selected = ids
    .split(",")
    .map((id) => vehicles.find((vehicle) => vehicle.slug === id))
    .filter((vehicle): vehicle is (typeof vehicles)[number] => Boolean(vehicle))
    .slice(0, 3);
  const highlights = getComparisonHighlights(selected);
  return (
    <>
      <PageIntro
        eyebrow="Vehicle comparison"
        title="Choose With More Confidence"
        copy="Compare the details that matter, understand what still needs confirmation, and request one clear quote for your selected vehicles."
        image={image}
      />
      <section className="section-pad">
        <div className="container-shell">
          <Link
            to="/cars"
            className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Back to cars
          </Link>
          {selected.length < 2 ? (
            <EmptyCompare />
          ) : (
            <>
              <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
                <SectionHeading
                  eyebrow={`${selected.length} of 3 vehicles selected`}
                  title="Your Vehicles, Side By Side"
                  copy="Use this view to compare specifications, ask better questions, and decide which vehicles deserve a quote."
                />
                <Button asChild size="lg" variant="automotive">
                  <Link to="/request-vehicle">
                    <MessageCircle /> Request quote for selected
                  </Link>
                </Button>
              </div>
              <div className="mb-10 grid gap-4 md:grid-cols-3">
                {highlights.map((highlight) => {
                  const vehicle = selected.find((item) => item.slug === highlight.slug);
                  if (!vehicle) return null;
                  return (
                    <article key={highlight.slug} className="border border-border bg-secondary p-5">
                      <p className="text-xs font-bold uppercase text-primary">{highlight.label}</p>
                      <h2 className="mt-2 text-xl font-extrabold uppercase">
                        {vehicle.brand} {vehicle.model}
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">{highlight.detail}</p>
                    </article>
                  );
                })}
              </div>
              <div className="overflow-x-auto border-l border-t border-border shadow-sm">
                {comparisonGroups.map((group) => (
                  <div key={group.title} className="min-w-[720px]">
                    <div className="border-b border-border bg-navy px-5 py-4 text-primary-foreground">
                      <h2 className="text-xl font-extrabold uppercase">{group.title}</h2>
                      <p className="mt-1 text-sm text-primary-foreground/65">{group.description}</p>
                    </div>
                    <table className="w-full border-collapse text-left">
                      <tbody>
                        {group.rows.map(({ label, getValue }) => (
                          <tr key={label}>
                            <th className="w-48 border-b border-r border-border bg-secondary p-4 text-xs font-bold uppercase text-muted-foreground">
                              {label}
                            </th>
                            {selected.map((vehicle) => (
                              <td
                                key={`${vehicle.slug}-${label}`}
                                className="border-b border-r border-border p-4 text-sm font-semibold"
                              >
                                {getValue(vehicle)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
                <div className="grid min-w-[720px] border-b border-border bg-background md:grid-cols-3">
                  {selected.map((vehicle) => (
                    <div key={vehicle.slug} className="border-r border-border p-5">
                      <img
                        src={vehicle.image}
                        alt={`${vehicle.year} ${vehicle.brand} ${vehicle.model}`}
                        className="aspect-[16/10] w-full object-cover"
                      />
                      <p className="mt-4 text-xs font-bold uppercase text-primary">
                        {vehicle.brand} · {vehicle.year}
                      </p>
                      <h2 className="mt-1 text-2xl font-extrabold uppercase">{vehicle.model}</h2>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button asChild size="sm">
                          <Link to="/cars/$slug" params={{ slug: vehicle.slug }}>
                            View details
                          </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                          <Link to="/request-vehicle">Ask about this car</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <CompareGuidance />
              <section className="mt-12 border border-primary/20 bg-secondary p-6 sm:p-8">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase text-primary">
                      Ready to narrow it down?
                    </p>
                    <h2 className="mt-2 text-3xl font-extrabold uppercase">
                      Request One Quote For Your Selected Vehicles
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                      AWA can confirm availability, inspection details, final pricing, shipping
                      assumptions, and the next step for all selected vehicles.
                    </p>
                  </div>
                  <Button asChild size="lg" variant="automotive">
                    <Link to="/request-vehicle">
                      Request selected quote <ArrowRight />
                    </Link>
                  </Button>
                </div>
              </section>
            </>
          )}
        </div>
      </section>
    </>
  );
}
function CompareGuidance() {
  const cards = [
    {
      icon: Scale,
      title: "Compare the fit",
      copy: "Think about passenger space, driving environment, fuel preference, and whether the vehicle matches your daily use.",
    },
    {
      icon: FileSearch,
      title: "Verify before paying",
      copy: "Ask for current images, inspection information, documents, availability, and the full landed-cost assumptions.",
    },
    {
      icon: Ship,
      title: "Plan the destination",
      copy: "Your country, port, duties, timeline, and delivery preference can change the final purchase conversation.",
    },
    {
      icon: ShieldCheck,
      title: "Keep a clear record",
      copy: "Use the quote conversation to capture the agreed specification, price, status, and next milestone.",
    },
  ];
  return (
    <section className="mt-12">
      <SectionHeading
        eyebrow="How to use this comparison"
        title="The Table Is The Starting Point"
        copy="A side-by-side view helps you ask better questions. AWA then confirms the details that cannot be judged from a listing alone."
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ icon: Icon, title, copy }) => (
          <article key={title} className="border-t-2 border-primary pt-5">
            <Icon className="h-6 w-6 text-primary" />
            <h2 className="mt-4 text-xl font-extrabold uppercase">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
function EmptyCompare() {
  return (
    <>
      <div className="border border-border bg-secondary p-8 text-center sm:p-12">
        <ClipboardCheck className="mx-auto h-12 w-12 text-primary" />
        <SectionHeading
          eyebrow="Choose two or three cars"
          title="Build Your Comparison"
          copy="Add vehicles from the Cars page using the Compare button. Your selected vehicles will appear here with grouped specifications, sourcing notes, and quote actions."
        />
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" variant="automotive">
            <Link to="/cars">
              Browse vehicles <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/cars">Choose vehicles to compare</Link>
          </Button>
        </div>
      </div>
      <section className="mt-12">
        <SectionHeading eyebrow="Why compare?" title="Make A More Informed Choice" />
        <div className="grid gap-5 md:grid-cols-3">
          {[
            [
              CheckCircle2,
              "See the trade-offs",
              "Place condition, year, mileage, powertrain, and availability in one view.",
            ],
            [
              MessageCircle,
              "Ask one clear question",
              "Send AWA a quote request for the exact vehicles you are considering.",
            ],
            [
              ShieldCheck,
              "Confirm what matters",
              "Use the comparison to guide inspection, documents, shipping, and final-price questions.",
            ],
          ].map(([Icon, title, copy]) => (
            <article key={String(title)} className="border border-border p-6">
              <Icon className="text-primary" />
              <h2 className="mt-5 text-2xl font-extrabold uppercase">{String(title)}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{String(copy)}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
