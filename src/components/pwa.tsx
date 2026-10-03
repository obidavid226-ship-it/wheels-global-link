import { useEffect, useState } from "react";
import {
  Check,
  ChevronRight,
  Download,
  Globe,
  MoreVertical,
  Share,
  Smartphone,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/awa-logo.png";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
const ONBOARDING_KEY = "awa-install-onboarding-seen";

export function PwaRuntime() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [onboarding, setOnboarding] = useState(false);
  const [reminder, setReminder] = useState(false);
  const [platform, setPlatform] = useState<"android" | "ios" | "desktop">("desktop");
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setPlatform(isIos ? "ios" : /android/i.test(navigator.userAgent) ? "android" : "desktop");
    setInstalled(standalone);
    if (!standalone && !localStorage.getItem(ONBOARDING_KEY)) setOnboarding(true);
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const dismiss = (remember = false) => {
    setOnboarding(false);
    setReminder(false);
    if (remember) localStorage.setItem(ONBOARDING_KEY, "1");
  };
  const install = async () => {
    if (installEvent) {
      await installEvent.prompt();
      setInstalled(true);
      dismiss(true);
    } else {
      dismiss(true);
      setReminder(true);
    }
  };
  if (installed) return null;

  return (
    <>
      {onboarding && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/35 p-3 sm:p-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-install-title"
            className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)] lg:grid lg:grid-cols-2 lg:overflow-hidden"
          >
            <div className="relative bg-white px-6 pb-7 pt-10 text-slate-900 sm:px-8 sm:pb-8 sm:pt-12 lg:flex lg:flex-col lg:justify-center lg:px-10">
              <button
                type="button"
                onClick={() => dismiss(true)}
                className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cancel install onboarding"
              >
                <X className="h-5 w-5" />
              </button>
              <img
                src={logo}
                alt="AWA AUTO MALL"
                className="h-auto w-48 max-w-[72vw] object-contain"
              />
              <p className="mt-7 text-xs font-bold uppercase tracking-[.2em] text-primary">
                AWA AUTO MALL
              </p>
              <h2
                id="pwa-install-title"
                className="mt-2 text-3xl font-extrabold leading-none sm:text-4xl"
              >
                Your vehicle desk,
                <br />
                ready to go.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-6 text-slate-500">
                Install the AWA app for faster access to vehicles, comparisons, inquiries, and
                sourcing updates.
              </p>
            </div>
            <div className="space-y-3 border-t border-slate-100 p-5 sm:p-8 lg:flex lg:flex-col lg:justify-center lg:border-l lg:border-t-0">
              <OnboardingItem icon={Smartphone} text="Quick access from your home screen" />
              <OnboardingItem icon={Globe} text="Works across Android, iPhone, iPad and desktop" />
              <OnboardingItem icon={Check} text="Fast loading with offline app shell support" />
              <Button onClick={install} size="lg" className="mt-3 w-full" variant="automotive">
                {installEvent ? (
                  <>
                    <Download /> Install AWA AUTO MALL
                  </>
                ) : (
                  <>
                    Show install instructions <ChevronRight />
                  </>
                )}
              </Button>
              <Button
                type="button"
                onClick={() => dismiss(true)}
                size="lg"
                variant="outline"
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      {reminder && (
        <InstallReminder
          platform={platform}
          installEvent={installEvent}
          onInstall={install}
          onClose={() => setReminder(false)}
        />
      )}
    </>
  );
}

function OnboardingItem({ icon: Icon, text }: { icon: typeof Check; text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span>{text}</span>
    </div>
  );
}

function InstallReminder({
  platform,
  installEvent,
  onInstall,
  onClose,
}: {
  platform: string;
  installEvent: InstallPromptEvent | null;
  onInstall: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-md rounded-2xl border border-primary/20 bg-white p-4 shadow-2xl sm:inset-x-auto sm:bottom-5 sm:right-5">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-white">
          <Download className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-extrabold">Install AWA AUTO MALL</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {installEvent
              ? "Add the app to your device for one-tap access."
              : platform === "ios"
                ? "Tap Share, then Add to Home Screen."
                : "Use your browser menu and choose Install or Add to Home Screen."}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cancel install reminder"
          className="rounded-full p-1 hover:bg-slate-100"
        >
          <X className="h-4 w-4 text-slate-400" />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        {(installEvent || platform !== "desktop") && (
          <Button size="sm" onClick={onInstall} className="flex-1">
            {installEvent ? (
              "Install now"
            ) : platform === "ios" ? (
              <>
                <Share /> Share menu
              </>
            ) : (
              <>
                <MoreVertical /> Browser menu
              </>
            )}
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
