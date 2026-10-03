import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { SectionHeading, VehicleGrid } from "@/components/marketplace";
import { vehicles } from "@/lib/inventory";
import hero from "@/assets/awa-cars-category.jpg";
import globalImage from "@/assets/awa-global.jpg";
import showroom from "@/assets/awa-showroom.jpg";

const typeContent = {
  suv: {
    title: "SUVs",
    copy: "Confident, versatile vehicles for family life, long trips, and everyday drive.",
    image: hero,
  },
  sedan: {
    title: "Sedans",
    copy: "Refined road cars with comfort, presence, and practical performance.",
    image: showroom,
  },
  truck: {
    title: "Trucks",
    copy: "Hard-working commercial vehicles for transport, trade, and ambitious operations.",
    image: globalImage,
  },
} as const;

function getCarType(model: string) {
  return /land cruiser|rx 350|range rover|santa fe|sport/i.test(model) ? "SUV" : "Sedan";
}

export const Route = createFileRoute("/cars/types/$type")({
  loader: ({ params }) => {
    const type = params.type.toLowerCase() as keyof typeof typeContent;
    const content = typeContent[type];
    if (!content) throw notFound();
    const matchingVehicles = vehicles.filter(
      (vehicle) =>
        vehicle.category?.toLowerCase() === type ||
        getCarType(vehicle.model).toLowerCase() === type,
    );
    return { type, content, vehicles: matchingVehicles };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.content.title ?? "Vehicle Type"} | AWA AUTO MALL` },
      {
        name: "description",
        content: `Explore ${loaderData?.content.title.toLowerCase() ?? "vehicle"} available through AWA AUTO MALL.`,
      },
    ],
  }),
  component: TypeDetailPage,
});

function TypeDetailPage() {
  const data = Route.useLoaderData();

  return (
    <>
      <div className="border-b border-border bg-secondary">
        <div className="container-shell flex min-h-12 items-center gap-2 overflow-hidden text-xs text-muted-foreground">
          <Link to="/" className="shrink-0 hover:text-primary">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <Link to="/cars" className="shrink-0 hover:text-primary">
            Cars
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <Link to="/cars/types" className="shrink-0 hover:text-primary">
            Vehicle types
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="truncate font-semibold capitalize text-foreground">
            {data.content.title}
          </span>
        </div>
      </div>
      <section className="relative overflow-hidden bg-navy text-primary-foreground">
        <img
          src={data.content.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-surface-dark via-surface-dark/80 to-transparent" />
        <div className="container-shell relative flex min-h-[440px] items-end py-16">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase text-primary-foreground/65">
              Vehicle type collection
            </p>
            <h1 className="mt-3 text-6xl font-extrabold uppercase leading-none sm:text-8xl">
              {data.content.title}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-primary-foreground/70">
              {data.content.copy}
            </p>
            <Link
              to="/cars/types"
              className="mt-8 inline-flex items-center gap-2 text-sm font-bold uppercase hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              All vehicle types
            </Link>
          </div>
        </div>
      </section>
      <section className="section-pad">
        <div className="container-shell">
          <SectionHeading
            eyebrow="Available in this category"
            title={`Explore ${data.content.title}`}
            copy="Review the current selection, compare vehicles, and request the vehicle that fits your brief."
          />
          <VehicleGrid items={data.vehicles} />
          <Link
            to="/cars"
            className="mt-10 inline-flex items-center gap-2 text-sm font-bold uppercase text-primary"
          >
            Browse all vehicles <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
