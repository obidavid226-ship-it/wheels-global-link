import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Search, SlidersHorizontal } from "lucide-react";
import { PageIntro, SectionHeading, VehicleGrid } from "@/components/marketplace";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { vehicles } from "@/lib/inventory";
import {
  currencyRates,
  currencySymbols,
  formatMarketplacePrice,
  getVehicleCategory,
  publicVehicles,
  vehicleMatches,
} from "@/lib/vehicle-platform";
import hero from "@/assets/awa-cars-category.jpg";

export const Route = createFileRoute("/cars")({
  validateSearch: (search) => ({
    q: typeof search.q === "string" ? search.q : "",
    brand: typeof search.brand === "string" ? search.brand : "All",
    model: typeof search.model === "string" ? search.model : "All",
    carType: typeof search.carType === "string" ? search.carType : "All",
    condition: typeof search.condition === "string" ? search.condition : "All",
    year: typeof search.year === "string" ? search.year : "All",
    page: typeof search.page === "number" ? search.page : 1,
  }),
  head: () => ({
    meta: [
      { title: "Cars for Sale & Sourcing | AWA AUTO MALL" },
      { name: "description", content: "Browse and source vehicles through AWA AUTO MALL." },
    ],
  }),
  component: CarsPage,
});
function CarsPage() {
  const navigate = Route.useNavigate();
  const { q, brand, model, carType, condition, year, page } = Route.useSearch();
  const [currency, setCurrency] = useState("USD");
  const [catalogVehicles, setCatalogVehicles] = useState<typeof vehicles>([]);
  const [catalogState, setCatalogState] = useState<"loading" | "ready" | "error">("loading");
  const [catalogError, setCatalogError] = useState("");
  const isDetail = useRouterState({
    select: (state) => state.location.pathname.startsWith("/cars/"),
  });
  useEffect(() => {
    const storedCurrency = localStorage.getItem("awa-currency") ?? "USD";
    setCurrency(storedCurrency in currencySymbols ? storedCurrency : "USD");
    let cancelled = false;
    publicVehicles()
      .then((items) => {
        if (cancelled) return;
        setCatalogVehicles(items);
        setCatalogState("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : "The live catalog could not be loaded.";
        setCatalogError(message);
        setCatalogState("error");
        if (import.meta.env.DEV) setCatalogVehicles(vehicles);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const brands = [...new Set(catalogVehicles.map((v) => v.brand))].sort();
  const models = [...new Set(catalogVehicles.map((v) => v.model))].sort();
  const years = [...new Set(catalogVehicles.map((v) => String(v.year)))].sort(
    (a, b) => Number(b) - Number(a),
  );
  const shown = useMemo(
    () =>
      catalogVehicles.filter(
        (v) =>
          vehicleMatches(v, q) &&
          (brand === "All" || v.brand === brand) &&
          (model === "All" || v.model === model) &&
          (condition === "All" || v.condition === condition) &&
          (carType === "All" || getVehicleCategory(v) === carType) &&
          (year === "All" || String(v.year) === year),
      ),
    [catalogVehicles, q, brand, model, condition, carType, year],
  );
  const updateSearch = (
    key: "q" | "brand" | "model" | "carType" | "condition" | "year",
    value: string,
  ) => navigate({ search: (previous) => ({ ...previous, [key]: value, page: 1 }) });
  const suggestions = q
    ? catalogVehicles.filter((vehicle) => vehicleMatches(vehicle, q)).slice(0, 5)
    : [];
  const pageSize = 12;
  const pageCount = Math.max(1, Math.ceil(shown.length / pageSize));
  const currentPage = Math.min(Math.max(page, 1), pageCount);
  const visibleVehicles = shown.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pricedVehicles = visibleVehicles.map((vehicle) => ({
    ...vehicle,
    price: formatMarketplacePrice(vehicle.price, currency),
  }));
  const hasFilters = Boolean(
    q ||
    brand !== "All" ||
    model !== "All" ||
    carType !== "All" ||
    condition !== "All" ||
    year !== "All",
  );
  if (isDetail) return <Outlet />;
  function chooseCurrency(value: string) {
    setCurrency(value);
    localStorage.setItem("awa-currency", value);
  }
  return (
    <>
      <PageIntro
        eyebrow="Vehicle marketplace"
        title="Find Your Next Vehicle"
        copy="Search, compare and request a quote for vehicles sourced from trusted markets."
        image={hero}
      />
      <section className="section-pad bg-secondary">
        <div className="container-shell">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Vehicle discovery"
              title="Search The Inventory"
              copy="Use make, model, year, vehicle type and condition to narrow your brief."
            />
            <label className="flex items-center gap-2 text-xs font-bold uppercase">
              Display currency{" "}
              <select
                value={currency}
                onChange={(e) => chooseCurrency(e.target.value)}
                className="h-10 border border-input bg-background px-3 text-sm font-normal"
              >
                {Object.keys(currencySymbols).map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="relative mb-8 border border-border bg-background p-5">
            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
              <label className="relative lg:col-span-2">
                <span className="sr-only">Search make or model</span>
                <Search className="absolute left-3 top-3 h-4 w-4 text-primary" />
                <Input
                  value={q}
                  onChange={(e) => updateSearch("q", e.target.value)}
                  placeholder="Search make, model or keyword"
                  className="pl-9"
                />
                {suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-12 z-20 border border-border bg-background p-2 shadow-xl">
                    {suggestions.map((vehicle) => (
                      <Link
                        key={vehicle.slug}
                        to="/cars/$slug"
                        params={{ slug: vehicle.slug }}
                        className="flex items-center gap-3 p-2 hover:bg-secondary"
                      >
                        <img src={vehicle.image} alt="" className="h-10 w-14 object-cover" />
                        <span className="text-sm font-bold">
                          {vehicle.year} {vehicle.brand} {vehicle.model}
                          <small className="ml-2 font-normal text-muted-foreground">
                            {vehicle.availability}
                          </small>
                        </span>
                      </Link>
                    ))}
                    <Link
                      to="/request-vehicle"
                      className="block border-t border-border p-2 text-xs font-bold uppercase text-primary"
                    >
                      No exact match? Request this vehicle <ArrowRight className="inline h-3 w-3" />
                    </Link>
                  </div>
                )}
              </label>
              <FilterSelect
                value={brand}
                onChange={(v) => updateSearch("brand", v)}
                label="Brand"
                options={brands}
              />
              <FilterSelect
                value={model}
                onChange={(v) => updateSearch("model", v)}
                label="Model"
                options={models}
              />
              <FilterSelect
                value={year}
                onChange={(v) => updateSearch("year", v)}
                label="Year"
                options={years}
              />
              <FilterSelect
                value={carType}
                onChange={(v) => updateSearch("carType", v)}
                label="Type"
                options={["SUV", "Sedan", "Truck", "Commercial"]}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <FilterSelect
                value={condition}
                onChange={(v) => updateSearch("condition", v)}
                label="Condition"
                options={["New", "Pre-owned"]}
              />
              <span className="text-xs text-muted-foreground">
                {shown.length} vehicle{shown.length === 1 ? "" : "s"} match your search
              </span>
            </div>
          </div>
          <div className="mb-10 grid gap-5 border border-primary/20 bg-background p-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-bold uppercase text-primary">Can't find your car?</p>
              <h2 className="mt-2 text-3xl font-extrabold uppercase">Tell us your exact brief.</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Our sourcing team can search beyond the published gallery.
              </p>
            </div>
            <Button asChild size="lg" variant="automotive">
              <Link to="/request-vehicle">
                Request a vehicle <ArrowRight />
              </Link>
            </Button>
          </div>
          <div className="mb-6 flex items-center gap-3">
            <SlidersHorizontal className="text-primary" />
            <h2 className="text-3xl font-extrabold uppercase">
              {hasFilters ? "Matching Vehicles" : "Explore All Vehicles"}
            </h2>
          </div>
          {catalogState === "loading" && (
            <div className="border border-border bg-background p-8 text-center text-sm text-muted-foreground">
              Loading the live vehicle catalog…
            </div>
          )}
          {catalogState === "error" && !import.meta.env.DEV && (
            <div className="border border-destructive/40 bg-background p-8 text-center">
              <h3 className="text-xl font-bold uppercase">Live inventory unavailable</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
                We could not load current stock. Please try again shortly or send us a sourcing
                brief.
              </p>
              <Button asChild className="mt-5" variant="automotive">
                <Link to="/request-vehicle">Request a vehicle</Link>
              </Button>
            </div>
          )}
          {catalogState === "error" && import.meta.env.DEV && (
            <p className="mb-4 border border-dashed border-primary/50 bg-background p-4 text-sm text-muted-foreground">
              Development fallback inventory is shown. Live catalog error: {catalogError}
            </p>
          )}
          {catalogState !== "loading" && (catalogState === "ready" || import.meta.env.DEV) && (
            <>
              {catalogState === "ready" && catalogVehicles.length === 0 ? (
                <div className="border border-border bg-background p-8 text-center">
                  <h3 className="text-xl font-bold uppercase">No vehicles currently published</h3>
                  <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
                    Our live inventory is currently empty. Send us your requirements and we can
                    source a match.
                  </p>
                  <Button asChild className="mt-5" variant="automotive">
                    <Link to="/request-vehicle">Request a vehicle</Link>
                  </Button>
                </div>
              ) : (
                <>
                  <VehicleGrid items={pricedVehicles} />
                  <div className="mt-10 flex justify-center gap-6 text-sm font-bold uppercase text-primary">
                    {currentPage > 1 && (
                      <button
                        onClick={() =>
                          navigate({ search: (p) => ({ ...p, page: currentPage - 1 }) })
                        }
                      >
                        Previous
                      </button>
                    )}
                    <span className="text-muted-foreground">
                      Page {currentPage} of {pageCount}
                    </span>
                    {currentPage < pageCount && (
                      <button
                        onClick={() =>
                          navigate({ search: (p) => ({ ...p, page: currentPage + 1 }) })
                        }
                      >
                        Next
                      </button>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}

function FilterSelect({
  value,
  onChange,
  label,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: string[];
}) {
  return (
    <label className="min-w-32 flex-1">
      <span className="sr-only">Filter by {label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full border border-input bg-background px-3 text-sm"
      >
        <option value="All">All {label}s</option>
        {options.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
    </label>
  );
}
