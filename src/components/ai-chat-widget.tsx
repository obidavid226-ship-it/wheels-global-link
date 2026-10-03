import { useState, type FormEvent } from "react";
import {
  Bot,
  CarFront,
  ChevronRight,
  CircleHelp,
  GitCompareArrows,
  MessageCircle,
  Send,
  Ship,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackAnalytics } from "@/lib/vehicle-platform";

type ChatAction = { label: string; href: string };
type ChatMessage = { role: "user" | "assistant"; content: string; actions?: ChatAction[] };
type HelpTopic = { label: string; prompt: string; icon: typeof CarFront };
type AssistantReply = { content: string; actions?: ChatAction[] };

const topics: HelpTopic[] = [
  { label: "Find a vehicle", prompt: "Help me find the right vehicle", icon: CarFront },
  { label: "Prices & currency", prompt: "Explain prices and currency conversion", icon: Sparkles },
  {
    label: "Sourcing & shipping",
    prompt: "Explain sourcing, shipping, and import costs",
    icon: Ship,
  },
  {
    label: "Compare vehicles",
    prompt: "How does vehicle comparison work?",
    icon: GitCompareArrows,
  },
  {
    label: "Prepare a quote",
    prompt: "What should I include in a quote request?",
    icon: MessageCircle,
  },
  { label: "Spare parts", prompt: "How do I request a spare part?", icon: CircleHelp },
];

const welcome =
  "I am the AWA Assistant. I can guide you through vehicle search, specifications, indicative pricing, sourcing, shipping, vehicle comparison, spare-parts requests, and the information our team needs for a quote. I provide general guidance—not a final price, customs ruling, inspection report, or purchase confirmation.";

const carsActions: ChatAction[] = [
  { label: "Browse cars", href: "/cars" },
  { label: "Request a vehicle", href: "/request-vehicle" },
];
const contactActions: ChatAction[] = [
  { label: "Contact team", href: "/contact" },
  { label: "Send an inquiry", href: "/request-vehicle" },
];

function replyFor(question: string): AssistantReply {
  const q = question.toLowerCase();
  if (
    q.includes("price") ||
    q.includes("currency") ||
    q.includes("usd") ||
    q.includes("ghs") ||
    q.includes("aed") ||
    q.includes("cny") ||
    q.includes("exchange")
  ) {
    return {
      content:
        "The currency selector changes the display currency for easier comparison. Displayed conversion is indicative and may use a configured reference rate; it is not a locked quotation. Before making a purchase, ask AWA to confirm the vehicle price, currency, supplier charges, inspection, inland transport, freight, insurance, duties, port fees, local delivery, and the validity period of the quote. A final invoice should identify the exact vehicle or part and the destination.",
      actions: carsActions,
    };
  }
  if (
    q.includes("ship") ||
    q.includes("import") ||
    q.includes("delivery") ||
    q.includes("custom") ||
    q.includes("port") ||
    q.includes("duty")
  ) {
    return {
      content:
        "Shipping and landed cost depend on the vehicle, destination city or port, shipping method, inspection, insurance, customs classification, import duties, port charges, local clearance, and last-mile delivery. For a useful estimate, send the destination country and port, vehicle link or specification, target budget, preferred delivery timing, and whether you need port-to-port or door-to-door support. Treat delivery wording on the site as guidance until the AWA team confirms it in writing.",
      actions: [...carsActions, { label: "Shipping information", href: "/shipping" }],
    };
  }
  if (
    q.includes("find") ||
    q.includes("search") ||
    q.includes("filter") ||
    q.includes("vehicle") ||
    q.includes("car") ||
    q.includes("suv") ||
    q.includes("sedan")
  ) {
    return {
      content:
        "Start on Cars and search by make or model. Use the available type, condition, year, fuel, transmission, and availability filters to narrow the list. Open a vehicle detail page to review images, specifications, indicative price, availability, and inquiry options. If the exact vehicle is not listed, send a sourcing brief with make, model, year range, condition, budget, destination, mileage target, fuel, transmission, colour, and must-have features.",
      actions: carsActions,
    };
  }
  if (q.includes("compare")) {
    return {
      content:
        "Use the Compare button on vehicle cards to select up to three vehicles, then review their year, condition, mileage, fuel, transmission, availability, price display, and sourcing notes side by side. Comparison does not reserve a vehicle, hold a price, or confirm availability; ask the team for a current written quote.",
      actions: [{ label: "Compare vehicles", href: "/compare" }],
    };
  }
  if (
    q.includes("request") ||
    q.includes("inquir") ||
    q.includes("quote") ||
    q.includes("buy") ||
    q.includes("order") ||
    q.includes("budget")
  ) {
    return {
      content:
        "A strong request includes your name, phone or WhatsApp, email, destination market or port, make and model, year range, new or pre-owned preference, budget and currency, quantity, mileage or specification requirements, colour, timing, and any inspection or shipping needs. Include a vehicle link when available. Do not send passwords, card numbers, identity documents, or private banking information. AWA will confirm availability, specification, final pricing, shipping, and payment instructions through the proper business channel.",
      actions: [{ label: "Open sourcing form", href: "/request-vehicle" }, ...contactActions],
    };
  }
  if (
    q.includes("part") ||
    q.includes("spare") ||
    q.includes("accessor") ||
    q.includes("component")
  ) {
    return {
      content:
        "For a spare-parts request, provide the vehicle make, model, year, engine or chassis/VIN details when appropriate, exact part name or part number, photos if useful, quantity, condition preference, and destination. Compatibility must be checked against the vehicle before ordering. Ask for availability, genuine/aftermarket status, warranty or return terms, shipping, and the final landed cost. Spare-parts catalog activation remains a separate phase from the initial car-marketplace launch.",
      actions: [{ label: "Spare parts", href: "/spare-parts" }, ...contactActions],
    };
  }
  if (
    q.includes("360") ||
    q.includes("image") ||
    q.includes("inspection") ||
    q.includes("condition")
  ) {
    return {
      content:
        "Use the image gallery and vehicle specifications on each detail page. Where a 360-degree asset is available, open the viewer to inspect the exterior presentation. Images are not a substitute for a current inspection report: ask AWA to confirm mileage, title/ownership information, accident history where available, mechanical condition, documents, and the date of the latest inspection before purchase.",
      actions: carsActions,
    };
  }
  if (q.includes("track") || q.includes("order status") || q.includes("shipment status")) {
    return {
      content:
        "Use Track Order with the order number and the phone number or email used for confirmation. The lookup is intentionally protected. If the order cannot be found, check the exact order number and confirmation contact, then contact AWA rather than sending order details in a public chat.",
      actions: [{ label: "Track an order", href: "/track-order" }, ...contactActions],
    };
  }
  if (
    q.includes("contact") ||
    q.includes("human") ||
    q.includes("agent") ||
    q.includes("whatsapp") ||
    q.includes("map") ||
    q.includes("location")
  ) {
    return {
      content:
        "For a human response, use the Contact page or WhatsApp. Include the vehicle or part link, destination, budget, and the exact question so the team can respond efficiently. AWA is based in Guangzhou, China; use the published contact details and request confirmation before sending documents or payment.",
      actions: contactActions,
    };
  }
  if (q.includes("admin") || q.includes("api") || q.includes("login")) {
    return {
      content:
        "The customer site does not require an admin login. Authorized AWA staff use the private admin area to manage vehicles, parts, inquiries, orders, articles, settings, and analytics. Customer information should be submitted through the public inquiry form or an approved AWA contact channel.",
      actions: [{ label: "Customer contact", href: "/contact" }],
    };
  }
  return {
    content:
      "I can help with vehicle search, filters, specifications, indicative prices, GHS/USD/AED/CNY display, sourcing, shipping, spare parts, inspection questions, comparison, order tracking, and preparing a quote request. Try a quick-help topic or ask something specific such as ‘What information should I send for a Land Cruiser quote?’",
    actions: carsActions,
  };
}

export function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);

  function openAssistant() {
    setOpen(true);
    trackAnalytics("assistant_open", "assistant");
  }

  function ask(content: string) {
    const question = content.trim();
    if (!question || busy) return;
    const next = [...messages, { role: "user" as const, content: question }];
    setMessages(next);
    setInput("");
    setBusy(true);
    trackAnalytics("assistant_question", "assistant", undefined, { length: question.length });
    window.setTimeout(() => {
      const answer = replyFor(question);
      setMessages([...next, { role: "assistant", ...answer }]);
      setBusy(false);
    }, 260);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    ask(input);
  }

  return (
    <>
      {open && (
        <section
          className="fixed bottom-[calc(10.5rem+env(safe-area-inset-bottom))] right-4 z-50 flex max-h-[min(680px,calc(100dvh-8rem))] w-[min(440px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl sm:bottom-24 sm:right-5"
          aria-label="AWA AUTO MALL guided assistant"
        >
          <div className="flex items-center justify-between bg-navy p-4 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <div>
                <strong className="block text-sm uppercase">AWA Assistant</strong>
                <span className="text-[11px] text-primary-foreground/70">
                  Guided vehicle sourcing help
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="rounded-full p-1 hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="border-b border-border bg-secondary/50 p-3">
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <CircleHelp className="h-3.5 w-3.5" /> Quick help
            </p>
            <div className="grid grid-cols-2 gap-2">
              {topics.map(({ label, prompt, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => ask(prompt)}
                  disabled={busy}
                  className="flex min-h-10 items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-2 text-left text-[11px] font-semibold leading-tight transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex min-h-40 flex-1 flex-col gap-3 overflow-y-auto p-4 text-sm">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="bg-secondary px-3 py-2 leading-5 text-foreground">{welcome}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {carsActions.map((action) => (
                    <a
                      key={action.href}
                      href={action.href}
                      className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
                    >
                      {action.label} <ChevronRight className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={message.role === "user" ? "max-w-[90%] self-end" : "max-w-[96%]"}
              >
                <p
                  className={
                    message.role === "user"
                      ? "rounded-lg bg-primary px-3 py-2 leading-5 text-primary-foreground"
                      : "rounded-lg bg-secondary px-3 py-2 leading-5 text-foreground"
                  }
                >
                  {message.content}
                </p>
                {message.role === "assistant" && message.actions && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {message.actions.map((action) => (
                      <a
                        key={`${action.label}-${action.href}`}
                        href={action.href}
                        target={action.href.startsWith("http") ? "_blank" : undefined}
                        rel={action.href.startsWith("http") ? "noreferrer" : undefined}
                        className="inline-flex items-center gap-1 border border-primary px-2 py-1 text-[11px] font-bold text-primary hover:bg-primary hover:text-primary-foreground"
                      >
                        {action.label} <ChevronRight className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {busy && <p className="text-muted-foreground">Preparing guidance…</p>}
          </div>
          <form onSubmit={submit} className="flex gap-2 border-t border-border p-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about cars, quotes, shipping…"
              aria-label="Assistant question"
              className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <Button
              type="submit"
              size="icon"
              aria-label="Send question"
              disabled={busy || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[10px] text-muted-foreground">
            <span>Guidance only. Never send passwords or payment details.</span>
            <a
              href="/contact"
              className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
            >
              <MessageCircle className="h-3 w-3" /> Contact team
            </a>
          </div>
        </section>
      )}
      <button
        type="button"
        onClick={open ? () => setOpen(false) : openAssistant}
        aria-label={open ? "Close AWA Assistant" : "Open AWA Assistant"}
        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-20 z-40 grid h-12 w-12 place-items-center rounded-full bg-navy text-primary-foreground shadow-lg transition-transform hover:scale-105 sm:bottom-5 sm:right-24 sm:h-14 sm:w-14"
      >
        <Bot className="h-6 w-6" />
      </button>
    </>
  );
}
