import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  CarFront,
  ClipboardList,
  ExternalLink,
  FileText,
  LayoutDashboard,
  LogIn,
  LogOut,
  MoreHorizontal,
  PackageCheck,
  Settings,
  Wifi,
  X,
} from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { API_BASE_URL, adminLogin, adminLogout, checkApiReady } from "@/lib/vehicle-platform";

type NavItem = { label: string; href: string; icon: typeof LayoutDashboard };
const navItems: NavItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Vehicles", href: "/admin/vehicles", icon: CarFront },
  { label: "Inquiries", href: "/admin/inquiries", icon: ClipboardList },
  { label: "Orders", href: "/admin/orders", icon: PackageCheck },
  { label: "Content", href: "/admin/content", icon: FileText },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];
const tabItems = navItems.slice(0, 4);
const moreItems = navItems.slice(4);
const TOKEN_KEY = "awa-admin-jwt";

export function AdminModuleShell({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  useEffect(() => {
    let active = true;
    const hasSession = Boolean(window.localStorage.getItem(TOKEN_KEY)) || false;
    if (hasSession) {
      setAuthenticated(true);
      setCheckingSession(false);
      return () => {
        active = false;
      };
    }
    checkApiReady().finally(() => {
      if (active) setCheckingSession(false);
    });
    return () => {
      active = false;
    };
  }, []);
  if (checkingSession) return <AuthLoadingScreen />;
  if (!authenticated) return <AdminLogin onAuthenticated={() => setAuthenticated(true)} />;
  return (
    <AdminWorkspace
      title={title}
      eyebrow={eyebrow}
      onLogout={() => {
        void adminLogout();
        setAuthenticated(false);
      }}
    >
      {children}
    </AdminWorkspace>
  );
}

function AuthLoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#f3f5f9] px-6">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <p className="mt-4 text-sm font-semibold text-slate-500">Checking admin access…</p>
      </div>
    </div>
  );
}

function AdminLogin({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(Boolean(API_BASE_URL));
  useEffect(() => {
    checkApiReady().then(setApiAvailable);
  }, []);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Enter your admin email and password.");
      return;
    }
    if (!API_BASE_URL || !apiAvailable) {
      setError(
        "The live API is not connected. Configure VITE_API_BASE_URL and use an authorized admin account.",
      );
      return;
    }
    setBusy(true);
    try {
      await adminLogin(email.trim(), password);
      onAuthenticated();
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Login failed. Check your details and try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="grid min-h-screen place-items-center bg-[#101b33] px-4 py-10">
      <section className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-8">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-2xl font-extrabold text-white">
            A
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[.2em] text-primary">
            AWA AUTO MALL
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
            Admin sign in
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Sign in to manage vehicles, inquiries, and content.
          </p>
        </div>
        <form className="space-y-4" onSubmit={submit}>
          <label className="block text-sm font-semibold text-slate-700">
            Email
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
            >
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" />
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs leading-5 text-slate-400">
          {apiAvailable
            ? "Live API detected. Use your configured admin credentials."
            : "API is not connected. Configure the API and sign in with an authorized admin account."}
        </p>
      </section>
    </main>
  );
}

function AdminWorkspace({
  title,
  eyebrow,
  children,
  onLogout,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
  onLogout: () => void;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = moreItems.some((item) => pathname.startsWith(item.href));
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);
  return (
    <div className="admin-app min-h-screen bg-[#f3f5f9] text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[#101b33] text-white lg:flex">
        <AdminBrand />
        <nav className="flex-1 space-y-1 px-3 py-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              activeOptions={{ exact: item.href === "/admin" }}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-white/60 transition hover:bg-white/5 hover:text-white data-[status=active]:bg-primary data-[status=active]:text-white"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <SourceCard className="m-3" />
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-2 border-t border-white/10 p-4 text-left text-sm font-semibold text-white/70 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </aside>
      <div className="min-w-0 lg:pl-64">
        <header className="sticky top-0 z-30 bg-[#101b33] pt-[env(safe-area-inset-top)] text-white shadow-lg shadow-[#101b33]/20 lg:hidden">
          <div className="flex h-14 items-center gap-3 px-4">
            <Link
              to="/admin"
              aria-label="Admin overview"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary font-display text-lg font-bold"
            >
              A
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[17px] font-extrabold leading-tight">{title}</h1>
              <p className="truncate text-[11px] font-medium leading-tight text-white/55">
                {eyebrow}
              </p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              aria-label="Sign out"
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        <header className="sticky top-0 z-30 hidden h-[4.5rem] items-center gap-4 border-b border-slate-200 bg-white/90 px-8 backdrop-blur-xl lg:flex">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
              AWA AUTO MALL · {eyebrow}
            </p>
            <p className="truncate text-2xl font-extrabold leading-tight">{title}</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:border-primary hover:text-primary"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </header>
        <main className="px-4 pb-32 pt-4 sm:px-6 lg:px-8 lg:pb-10 lg:pt-6">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-6 hidden lg:block">
              <Pulse
                label="Data source"
                value={API_BASE_URL ? "Live API" : "Unavailable"}
                icon={Wifi}
                tone="purple"
              />
            </div>
            {children}
          </div>
        </main>
      </div>
      <nav className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 flex items-center rounded-[1.75rem] bg-[#101b33] px-2 py-1.5 shadow-2xl shadow-[#101b33]/40 lg:hidden">
        {tabItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            activeOptions={{ exact: item.href === "/admin" }}
            className="group flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-semibold text-white/55 transition data-[status=active]:text-white"
          >
            <span className="grid h-8 w-12 place-items-center rounded-full transition group-data-[status=active]:bg-primary">
              <item.icon className="h-5 w-5" />
            </span>
            {item.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-label="More"
          data-status={moreActive ? "active" : undefined}
          className="group flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-semibold text-white/55 transition data-[status=active]:text-white"
        >
          <span className="grid h-8 w-12 place-items-center rounded-full transition group-data-[status=active]:bg-primary">
            <MoreHorizontal className="h-5 w-5" />
          </span>
          More
        </button>
      </nav>
      {moreOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
            className="absolute inset-0 bg-[#081126]/60 backdrop-blur-sm"
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[2rem] bg-white px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 shadow-2xl">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200" />
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-extrabold">More</p>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setMoreOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {moreItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="flex flex-col items-center gap-2 rounded-2xl bg-slate-50 px-2 py-4 text-xs font-bold text-slate-600 data-[status=active]:bg-primary data-[status=active]:text-white"
                >
                  <item.icon className="h-6 w-6" />
                  {item.label}
                </Link>
              ))}
              <a
                href="/cars"
                className="flex flex-col items-center gap-2 rounded-2xl bg-slate-50 px-2 py-4 text-xs font-bold text-slate-600"
              >
                <ExternalLink className="h-6 w-6" />
                Website
              </a>
            </div>
            <SourceCard className="mt-4" light />
          </div>
        </div>
      )}
    </div>
  );
}

function SourceCard({ className = "", light = false }: { className?: string; light?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-4 ${light ? "border-slate-200 bg-slate-50" : "border-white/10 bg-white/5"} ${className}`}
    >
      <p
        className={`flex items-center gap-2 text-xs font-bold uppercase ${light ? "text-emerald-600" : "text-emerald-300"}`}
      >
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        {API_BASE_URL ? "API configured · live data" : "API unavailable"}
      </p>
      <p
        className={`mt-2 break-words text-xs leading-5 ${light ? "text-slate-500" : "text-white/50"}`}
      >
        {API_BASE_URL || "Connect the PHP API to load live workspace data."}
      </p>
    </div>
  );
}
function Pulse({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof Activity;
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
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${toneClass}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="truncate text-xs font-bold uppercase text-slate-400">{label}</span>
      </div>
      <p className="mt-3 truncate text-base font-extrabold">{value}</p>
    </div>
  );
}
function AdminBrand() {
  return (
    <Link to="/admin" className="flex items-center gap-3 px-4 py-5">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary font-display text-xl font-bold">
        A
      </div>
      <div>
        <p className="font-display text-xl font-extrabold tracking-wide">AWA</p>
        <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-white/45">
          Auto mall
        </p>
      </div>
    </Link>
  );
}
