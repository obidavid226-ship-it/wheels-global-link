import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CarFront, ChevronRight, ClipboardList, Plus, ShieldCheck } from "lucide-react";
import { AdminModuleShell } from "@/components/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { API_BASE_URL, adminList, apiRequest, checkApiReady } from "@/lib/vehicle-platform";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard | AWA AUTO MALL" }] }),
  component: AdminLayout,
});

type Summary = {
  totalVehicles: number;
  availableVehicles: number;
  inquiries: number;
  newInquiries?: number;
};
type RecentInquiry = {
  id?: number;
  customer_name: string;
  type?: string;
  request_text?: string;
  status?: string;
  created_at?: string;
};
const emptySummary: Summary = {
  totalVehicles: 0,
  availableVehicles: 0,
  inquiries: 0,
};

function AdminOverview() {
  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [inquiries, setInquiries] = useState<RecentInquiry[]>([]);
  const [loading, setLoading] = useState(Boolean(API_BASE_URL));
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    if (!API_BASE_URL) {
      setLoading(false);
      return;
    }
    checkApiReady()
      .then((ready) => {
        setConnected(ready);
        if (!ready) return;
        return Promise.all([
          apiRequest<{ ok: true; data: Summary }>("/admin/summary"),
          adminList<RecentInquiry>("inquiries", "?per_page=5&page=1"),
        ])
          .then(([summaryPayload, inquiryPayload]) => {
            setSummary({
              ...summaryPayload.data,
              inquiries: summaryPayload.data.newInquiries ?? summaryPayload.data.inquiries ?? 0,
            });
            setInquiries(inquiryPayload.data.slice(0, 5));
          })
          .catch(() => setConnected(false));
      })
      .finally(() => setLoading(false));
  }, []);
  return (
    <AdminModuleShell title="Dashboard" eyebrow="Good morning, AWA team">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant={connected ? "default" : "secondary"}>
              {connected ? "LIVE API" : "API UNAVAILABLE"}
            </Badge>
            <span className="text-xs font-semibold text-slate-500">
              {loading
                ? "Syncing with PHP API…"
                : connected
                  ? "Last synced just now"
                  : "API unavailable"}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Here is what is happening across your vehicle business today.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="automotive" size="sm">
            <Link to="/admin/vehicles">
              <Plus /> <span className="hidden sm:inline">Add vehicle</span>
            </Link>
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Metric label="Total vehicles" value={summary.totalVehicles} icon={CarFront} tone="blue" />
        <Metric
          label="Available vehicles"
          value={summary.availableVehicles}
          icon={ShieldCheck}
          tone="green"
        />
        <Metric
          label="New inquiries"
          value={summary.inquiries}
          icon={ClipboardList}
          tone="orange"
        />
      </div>
      <div className="mt-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Inventory health
              </p>
              <h2 className="mt-1 text-xl font-extrabold">Vehicle status</h2>
            </div>
            <CarFront className="text-primary" />
          </div>
          <div className="mt-6 space-y-5">
            <StatusBar
              label="Available"
              value={summary.availableVehicles}
              total={summary.totalVehicles}
              color="bg-emerald-500"
            />
            <p className="text-sm text-slate-500">
              Reserved, sold, and made-to-order counts will appear when returned by the live summary
              API.
            </p>
          </div>
          <Button asChild variant="outline" className="mt-6 w-full">
            <Link to="/admin/vehicles">
              Manage inventory <ChevronRight />
            </Link>
          </Button>
        </section>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Needs attention
              </p>
              <h2 className="mt-1 text-xl font-extrabold">Recent inquiries</h2>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/inquiries">
                View all <ChevronRight />
              </Link>
            </Button>
          </div>
          <div className="divide-y divide-slate-100">
            {inquiries.length ? (
              inquiries.map((item, index) => (
                <div
                  key={item.id ?? `${item.customer_name}-${index}`}
                  className="flex items-center gap-3 p-4 sm:gap-4 sm:px-6"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {item.customer_name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{item.customer_name}</p>
                    <p className="truncate text-xs text-slate-500">
                      {item.type || "Inquiry"} · {item.request_text || "No request details"}
                    </p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <Badge variant={item.status === "New" ? "default" : "secondary"}>
                      {item.status || "New"}
                    </Badge>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 sm:hidden" />
                </div>
              ))
            ) : (
              <p className="p-6 text-sm text-slate-500">
                No live inquiries have been returned by the API.
              </p>
            )}
          </div>
        </section>
      </div>
    </AdminModuleShell>
  );
}
function AdminLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  // /admin is the overview; child admin routes render through the Outlet.
  if (pathname.replace(/\/+$/, "") !== "/admin") return <Outlet />;
  return <AdminOverview />;
}
function Metric({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof CarFront;
  tone: string;
}) {
  const toneClass =
    tone === "green"
      ? "bg-emerald-50 text-emerald-600"
      : tone === "orange"
        ? "bg-orange-50 text-orange-600"
        : tone === "purple"
          ? "bg-violet-50 text-violet-600"
          : "bg-blue-50 text-blue-600";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between">
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-xs font-semibold text-slate-500 sm:mt-5">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{value}</p>
    </div>
  );
}
function StatusBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percentage = Math.max(8, Math.round((value / Math.max(total, 1)) * 100));
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="font-semibold">{label}</span>
        <span className="text-slate-500">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
