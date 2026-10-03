import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Eye, MessageCircle, RefreshCw, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminModuleShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { API_BASE_URL, apiRequest } from "@/lib/vehicle-platform";
export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics | AWA Admin" }] }),
  component: AnalyticsAdminPage,
});
type EventRow = { day: string; event_name: string; count: number };
type Top = { entity_type?: string; entity_id?: number; event_name: string; count: number };
type Analytics = { events: EventRow[]; top_entities: Top[] };
const emptyAnalytics: Analytics = { events: [], top_entities: [] };
function AnalyticsAdminPage() {
  const [data, setData] = useState(emptyAnalytics);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(Boolean(API_BASE_URL));
  const load = () => {
    if (!API_BASE_URL) {
      setLoading(false);
      return;
    }
    setLoading(true);
    apiRequest<{ ok: true; data: Analytics }>("/admin/analytics?days=30")
      .then((r) => {
        setData(r.data);
        setLive(true);
      })
      .catch(() => setLive(false))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);
  const totals = useMemo(
    () =>
      data.events.reduce<Record<string, number>>((a, x) => {
        a[x.event_name] = (a[x.event_name] || 0) + Number(x.count);
        return a;
      }, {}),
    [data],
  );
  const cards = [
    { label: "Marketplace visits", key: "page_view", icon: Eye },
    { label: "Quote requests", key: "inquiry_created", icon: MessageCircle },
    { label: "Returning visitors", key: "session_start", icon: Users },
  ];
  const max = Math.max(1, ...data.events.map((x) => Number(x.count)));
  return (
    <AdminModuleShell title="Analytics" eyebrow="Performance">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            Understand what customers discover, compare, and request.
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            {loading ? "Syncing…" : live ? "Live API data · last 30 days" : "API unavailable"}
          </p>
        </div>
        <Button variant="outline" onClick={load}>
          <RefreshCw /> Refresh
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.key}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <card.icon className="h-5 w-5 text-primary" />
            <p className="mt-5 text-xs font-semibold text-slate-500">{card.label}</p>
            <p className="mt-1 text-3xl font-extrabold">
              {(totals[card.key] || 0).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Discovery trend
              </p>
              <h2 className="mt-1 text-xl font-extrabold">Daily event activity</h2>
            </div>
            <BarChart3 className="text-primary" />
          </div>
          <div className="mt-8 flex h-56 items-end gap-2">
            {data.events.slice(-14).map((row, i) => (
              <div
                key={`${row.day}-${row.event_name}-${i}`}
                className="flex flex-1 items-end"
                title={`${row.day}: ${row.count}`}
              >
                <div
                  className="w-full rounded-t bg-primary/80"
                  style={{ height: `${Math.max(5, (Number(row.count) / max) * 100)}%` }}
                />
              </div>
            ))}
          </div>
          {!data.events.length && (
            <p className="mt-5 text-sm text-slate-500">
              No analytics events recorded yet. Add the public POST /analytics call to page,
              compare, and inquiry actions.
            </p>
          )}
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Top entities</p>
          <h2 className="mt-1 text-xl font-extrabold">Most active</h2>
          <div className="mt-6 space-y-5">
            {data.top_entities.slice(0, 6).map((row, i) => (
              <div key={`${row.entity_type}-${row.entity_id}-${i}`}>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">
                    {row.entity_type || row.event_name} #{row.entity_id || ""}
                  </span>
                  <span className="text-slate-500">{row.count}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${Math.min(100, (row.count / Math.max(1, data.top_entities[0]?.count)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {!data.top_entities.length && (
              <p className="text-sm text-slate-500">
                Top vehicle and inquiry activity will appear here once events are recorded.
              </p>
            )}
          </div>
        </section>
      </div>
      {!live && !loading && (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
          Live analytics are unavailable. Configure the API and sign in with an authorized admin
          account.
        </div>
      )}
    </AdminModuleShell>
  );
}
