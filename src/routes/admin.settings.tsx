import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, RefreshCw, Save, ServerCog, ShieldCheck, Wifi } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminModuleShell } from "@/components/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE_URL, API_HEALTH_PATH, apiRequest, checkApiReady } from "@/lib/vehicle-platform";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings | AWA Admin" }] }),
  component: SettingsAdminPage,
});
type Setting = { setting_key: string; setting_value: string };
const defaults: Record<string, string> = {
  business_name: "AWA AUTO MALL",
  operating_location: "Guangzhou, China",
  whatsapp_number: "+971586106612",
  default_currency: "GHS",
  default_language: "English",
  timezone: "Asia/Shanghai",
};

function SettingsAdminPage() {
  const [values, setValues] = useState(defaults);
  const [live, setLive] = useState(false);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const load = async () => {
    try {
      const [result, health] = await Promise.all([
        apiRequest<{ ok: true; data: Setting[] }>("/admin/settings"),
        checkApiReady(),
      ]);
      const next = { ...defaults };
      result.data.forEach((item) => {
        next[item.setting_key] = item.setting_value;
      });
      setValues(next);
      setLive(true);
      setReady(health);
      setMessage("");
    } catch (error) {
      setLive(false);
      setReady(false);
      setMessage(error instanceof Error ? error.message : "Unable to load settings");
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      await apiRequest("/admin/settings", { method: "PATCH", body: JSON.stringify(values) });
      setLive(true);
      setMessage("Organization settings saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save settings");
    } finally {
      setSaving(false);
    }
  };
  const field = (key: string, label: string) => (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase text-slate-500">{label}</span>
      <Input
        value={values[key] ?? ""}
        onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}
      />
    </label>
  );
  return (
    <AdminModuleShell title="Workspace settings" eyebrow="Configuration">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            Control the connection and manage public organization details.
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            {live ? "Live API settings" : "API unavailable"}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant={ready ? "default" : "secondary"}>
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-500" />
            {ready ? "API healthy" : "API unavailable"}
          </Badge>
          <Button variant="outline" onClick={() => void load()}>
            <RefreshCw /> Refresh
          </Button>
        </div>
      </div>
      {message && (
        <div
          role="status"
          className="mb-5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
        >
          {message}
        </div>
      )}
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Header
              icon={ServerCog}
              title="API connection"
              copy="Inspect the live API connection used by the admin workspace."
            />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Field label="API base URL" value={API_BASE_URL} readOnly />
            <Field label="Health endpoint" value={API_HEALTH_PATH} readOnly />
            <Field label="Management endpoint" value="/admin/*" readOnly />
          </div>
          <div className="mt-5 flex items-center gap-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            <CheckCircle2
              className={ready ? "h-4 w-4 text-emerald-600" : "h-4 w-4 text-slate-400"}
            />
            {ready
              ? "The API is reachable and admin requests are enabled."
              : "The API is not currently reachable. Check the API deployment and credentials."}
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2">
          <Header
            icon={Wifi}
            title="Organization profile"
            copy="These values are saved to the store_settings table through the API."
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {field("business_name", "Business name")}
            {field("operating_location", "Operating location")}
            {field("whatsapp_number", "WhatsApp number")}
            {field("default_currency", "Default currency")}
            {field("default_language", "Default language")}
            {field("timezone", "Timezone")}
          </div>
          <Button onClick={() => void save()} disabled={!ready || saving} className="mt-6">
            <Save /> {saving ? "Saving…" : "Save organization settings"}
          </Button>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <Header
            icon={ShieldCheck}
            title="Security status"
            copy="Sensitive settings remain server-side."
          />
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <p>Admin requests use the bearer session created by the login endpoint.</p>
            <p>Database credentials and mail settings are never sent to this frontend.</p>
            <p>All admin mutations are recorded in the API audit log.</p>
          </div>
        </section>
      </div>
    </AdminModuleShell>
  );
}
function Header({
  icon: Icon,
  title,
  copy,
}: {
  icon: typeof ServerCog;
  title: string;
  copy: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-xl font-extrabold">{title}</h2>
        <p className="text-xs text-slate-500">{copy}</p>
      </div>
    </div>
  );
}
function Field({
  label,
  value,
  readOnly = false,
}: {
  label: string;
  value: string;
  readOnly?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase text-slate-500">{label}</span>
      <Input value={value} readOnly={readOnly} />
    </label>
  );
}
