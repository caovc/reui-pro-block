import { LimelightTestimonials } from "./limelight-testimonials";
import { portraitAssets } from "./photo-assets";
import { useState, useRef } from "react";
import { Scrollspy } from "@/components/reui/scrollspy";
import {
  ArrowRight,
  Workflow,
  Layers,
  Sparkles,
  Bot,
  Users,
  Check,
  Menu,
  Sun,
  Zap,
  Shield,
  Calendar,
  BarChart3,
  GitFork as Github,
  X,
  Search,
  Play,
  Settings,
  Database,
  Activity,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Button, Input, Modal, Sparkline, Mark } from "./shared";
import "./marketing.css";
import { wallpaperAssets } from "./wallpaper-assets";
const cues = [
  "Wire in the stack",
  "Let the model assemble",
  "Shape it to the team",
  "Promote to production",
];
function Console({ cue = 0 }: { cue?: number }) {
  const [period, setPeriod] = useState("Week");
  const [tab, setTab] = useState("Overview");
  return (
    <div className="ct-console">
      <div className="ct-console-bar">
        <span className="ct-lime-logo">
          <Zap size={18} />
        </span>
        <span>Limelight</span>
        <span>/</span>
        <span>Production</span>
        <span>/</span>
        <b>{cue ? cues[cue - 1] : tab}</b>
        <div className="ct-grow" />
        <span className="ct-console-status">
          ● All systems <b>Normal</b>
        </span>
      </div>
      <div className="ct-console-body">
        <aside>
          <div className="ct-console-search">
            <Search size={13} />
            Search runs, records, tools
          </div>
          <small>Production</small>
          {[
            "Overview",
            "Integrations",
            "Ingest",
            "Workspace",
            "Deploy",
            "Runs",
            "Audit",
            "Settings",
          ].map((t, i) => {
            const Icon = [Activity, Workflow, Database, Users, Play, Layers, Shield, Settings][i];
            return (
              <button
                type="button"
                key={t}
                className={tab === t ? "active" : ""}
                onClick={() => setTab(t)}
              >
                <Icon size={14} />
                {t}
              </button>
            );
          })}
        </aside>
        <div className="ct-console-main">
          {tab === "Overview" && !cue ? (
            <>
              <div className="ct-console-panel">
                <div className="ct-between">
                  <div>
                    <b>Operations overview</b>
                    <p>Throughput, latency, and what is waiting on a person.</p>
                  </div>
                  <div className="ct-console-segment">
                    {["Week", "Month", "Year"].map((p) => (
                      <button
                        type="button"
                        className={period === p ? "active" : ""}
                        onClick={() => setPeriod(p)}
                        key={p}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="ct-console-stats">
                  {[
                    [
                      "Runs completed",
                      period === "Week" ? "58,247" : period === "Month" ? "251,580" : "2,852,270",
                      "8.2%",
                    ],
                    ["Active pipelines", "38", "2"],
                    ["Median latency", "214ms", "18ms"],
                    ["Error rate", "0.14%", "0.03"],
                  ].map((s, i) => (
                    <div key={s[0]}>
                      <small>{s[0]}</small>
                      <strong>
                        {s[1]}
                        <em>↗ {s[2]}</em>
                      </strong>
                      <Sparkline color="#eddf00" seed={i} />
                    </div>
                  ))}
                </div>
                <div className="ct-console-foot">
                  Every delta compares with the previous {period.toLowerCase()}.
                  <button type="button" onClick={() => setTab("Runs")}>
                    View runs →
                  </button>
                </div>
              </div>
              <div className="ct-console-lower">
                <div className="ct-console-panel">
                  <b>Throughput</b>
                  <p>Runs started per hour, last 24 hours</p>
                  <svg
                    viewBox="0 0 300 150"
                    className="ct-console-graph"
                    aria-label="Throughput chart"
                  >
                    <path
                      d="M0 120L20 110L40 116L60 80L80 91L100 45L120 61L140 40L160 55L180 20L200 32L220 15L240 27L260 40L280 22L300 14"
                      stroke="#eddf00"
                      fill="none"
                      strokeWidth="2"
                    />
                    {[40, 80, 120].map((y) => (
                      <line
                        key={y}
                        x1="0"
                        x2="300"
                        y1={y}
                        y2={y}
                        stroke="#333"
                        strokeDasharray="3 3"
                      />
                    ))}
                  </svg>
                </div>
                <div className="ct-console-panel">
                  <b>Run schedule</b>
                  <p>Next five on the clock</p>
                  {[
                    "Arclight nightly reconcile",
                    "Nightjar event backfill",
                    "Veldt ledger export",
                    "Halcyon enrichment sweep",
                  ].map((n, i) => (
                    <div className="ct-console-row" key={n}>
                      <span>
                        {n}
                        <small>every {i + 1}h</small>
                      </span>
                      <span>{14 + i}:20</span>
                    </div>
                  ))}
                </div>
                <div className="ct-console-panel">
                  <b>Waiting on you</b>
                  <p>Approvals in the queue</p>
                  {[
                    "Promote ingest-v12 to production",
                    "Raise rate limit to 5k/min",
                    "Grant read on billing.events",
                    "Retire the legacy webhook",
                  ].map((n, i) => (
                    <button
                      type="button"
                      className="ct-console-row"
                      key={n}
                      onClick={() => toast.success("Demo approval acknowledged")}
                    >
                      <span>
                        {n}
                        <small>
                          {["Priya Raman", "Diego Marin", "Yuki Tanaka", "Noah Bennett"][i]}
                        </small>
                        <span>{4 + i * 8}m</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="ct-console-panel">
              <b>{cue ? cues[cue - 1] : tab}</b>
              <p>
                {cue
                  ? "From your first connection to your next production deploy."
                  : "One typed client per tool, regenerated on every schema change."}
              </p>
              {["Quarry", "Ledger", "Beacon", "Switchboard", "Mailroom", "Shipyard"].map((n, i) => (
                <div className="ct-integration-row" key={n}>
                  <span className="ct-integration-mark">{n[0]}</span>
                  <span>
                    <b>{n}</b>
                    <small>
                      {["Warehouse", "Billing", "Analytics", "Support", "Messaging", "Delivery"][i]}
                    </small>
                  </span>
                  <code>
                    @limelight/{n.toLowerCase()}@{i + 1}.2.0
                  </code>
                  <span className="ct-grow" />
                  <button type="button" onClick={() => toast.success(n + " connection checked")}>
                    {i === 5 ? "Connect" : "✓ Clean"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function Wallpaper() {
  return (
    <div className="ct-wallpaper" aria-hidden="true">
      {Array.from({ length: 5 }, (_, row) => (
        <div className={"ct-wall-row row-" + row} key={row}>
          <div className="ct-wall-track">
            {[
              ...wallpaperAssets.slice(row * 15, row * 15 + 15),
              ...wallpaperAssets.slice(row * 15, row * 15 + 15),
            ].map((src, i) => (
              <div className="ct-wall-tile" key={i}>
                <img src={src} alt="" loading={i < 8 ? "eager" : "lazy"} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
function Overture() {
  const [joined, setJoined] = useState(false);
  const [email, setEmail] = useState("");
  return (
    <div className="ct-overture">
      <Wallpaper />
      <div className="ct-overture-shade" />
      <header>
        <a href="#/templates" aria-label="Bricklane Templates">
          <Mark />
          <b>Bricklane</b>
        </a>
        <div>
          <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="X">
            <X size={17} />
          </a>
          <a
            href="https://github.com/caovc/reui-pro-block"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github size={14} />
            Source
          </a>
        </div>
      </header>
      <main>
        <span className="ct-early">
          <span />
          Early access 40% discount
        </span>
        <h1>
          A design-forward toolkit for
          <br className="ct-desktop-break" /> interfaces that stand out
        </h1>
        <p>
          Go beyond generic defaults and ship polished, high-end products faster without rebuilding
          the basics.
        </p>
        <div className="ct-feature-pills">
          {[
            [Layers, "1000+ UI Blocks"],
            [Sparkles, "2200+ Animated Icons"],
            [Workflow, "30+ Templates"],
            [Bot, "AI Tooling"],
          ].map(([Icon, label]) => (
            <span key={String(label)}>
              {typeof Icon !== "string" && <Icon size={16} />} {String(label)}
            </span>
          ))}
        </div>
        <form
          className="ct-waitlist"
          onSubmit={(e) => {
            e.preventDefault();
            setJoined(true);
          }}
        >
          {joined ? (
            <div className="ct-wait-success" role="status">
              <Check size={18} />
              You're on the list. See you at launch!
            </div>
          ) : (
            <>
              <Input
                aria-label="Email Address"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit">
                Join Waitlist
                <ArrowRight />
              </Button>
            </>
          )}
        </form>
        <small>
          {joined
            ? "Your early access discount is reserved for " + email
            : "Waitlist members get 40% off at launch in the coming weeks."}
        </small>
      </main>
      <div className="ct-wait-count">
        <span>
          <Users size={18} />
        </span>
        <div>
          <b>{joined ? "2,432" : "2,431"}</b>
          <small>People waiting</small>
        </div>
      </div>
    </div>
  );
}
function Limelight() {
  const scrollTarget = useRef<Document>(document);
  const navRef = useRef<HTMLElement>(null);
  const [activeSection, setActiveSection] = useState("lime-home");
  const [yearly, setYearly] = useState(false);
  const [cue, setCue] = useState(0);
  const [trial, setTrial] = useState(false);
  const [menu, setMenu] = useState(false);
  const [sent, setSent] = useState(false);
  const [light, setLight] = useState(false);
  const nav = ["Home", "How it works", "Features", "Pricing", "FAQ", "Contact"];
  function scroll(n: string) {
    navRef.current
      ?.querySelector<HTMLButtonElement>(
        '[data-scrollspy-anchor="lime-' + n.toLowerCase().replaceAll(" ", "-") + '"]',
      )
      ?.click();
    setMenu(false);
  }
  return (
    <div className={"ct-limelight " + (light ? "ct-limelight-light" : "")}>
      <div className="ct-lime-spot" />
      <header className={"ct-lime-header " + (activeSection !== "lime-home" ? "compact" : "")}>
        <button type="button" className="ct-lime-brand" onClick={() => scroll("Home")}>
          <Zap fill="currentColor" />
          <b>Limelight</b>
        </button>
        <nav ref={navRef} className={menu ? "open" : ""}>
          <Scrollspy
            history={false}
            onUpdate={setActiveSection}
            targetRef={scrollTarget}
            offset={80}
          >
            {nav.map((n) => (
              <button
                type="button"
                key={n}
                data-scrollspy-anchor={"lime-" + n.toLowerCase().replaceAll(" ", "-")}
                onClick={() => setMenu(false)}
              >
                {n}
              </button>
            ))}
          </Scrollspy>
        </nav>
        <div className="ct-toolbar">
          <button
            type="button"
            className="ct-lime-theme"
            aria-label="Toggle landing theme"
            onClick={() => setLight(!light)}
          >
            <Sun size={17} />
          </button>
          <Button className="ct-lime-cta" onClick={() => scroll("Pricing")}>
            Start free
          </Button>
          <button
            type="button"
            className="ct-lime-menu"
            aria-label="Open menu"
            onClick={() => setMenu(!menu)}
          >
            <Menu />
          </button>
        </div>
      </header>
      <main>
        <section id="lime-home" className="ct-lime-hero">
          <h1>
            Run the whole <span>show</span>
            <br />
            from one console.
          </h1>
          <div className="ct-lime-intro">
            <p>
              One console for the tools, the data, and the routine work between them.
              <br />
              Typed end to end, automated on your cues.
            </p>
            <div>
              <div className="ct-toolbar">
                <Button className="ct-lime-cta" size="lg" onClick={() => scroll("Pricing")}>
                  Start free trial
                  <ArrowRight />
                </Button>
                <Button
                  className="ct-lime-outline"
                  size="lg"
                  onClick={() => scroll("How it works")}
                >
                  <Workflow />
                  See how it works
                </Button>
              </div>
              <small>
                <span className="ct-lime-people">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <img key={n} src={portraitAssets[n - 1]} alt="" />
                  ))}
                </span>
                <b>2,400+ teams</b> run production on Limelight
              </small>
            </div>
          </div>
          <Console />
        </section>
        <section className="ct-lime-proof">
          <p>2,400+ teams ship on Limelight</p>
          <small>
            From seed-stage launches to public companies, in 40 countries, on 99.9% measured uptime.
          </small>
          <div>
            {["GitHub", "OpenAI", "NVIDIA", "Cursor", "Convex", "n8n", "TIDAL", "Codex"].map(
              (n) => (
                <b key={n}>{n}</b>
              ),
            )}
          </div>
        </section>
        <section id="lime-how-it-works" className="ct-lime-section">
          <h2>Four cues from signup to production</h2>
          <p>
            Every cue below is the live console, not demo data. The run fits inside a coffee break.
          </p>
          <div className="ct-lime-tour">
            <div>
              {cues.map((c, i) => (
                <button
                  type="button"
                  className={cue === i ? "active" : ""}
                  key={c}
                  onClick={() => setCue(i)}
                >
                  <span>0{i + 1}</span>
                  <div>
                    <h3>{c}</h3>
                    {cue === i && (
                      <p>
                        {
                          [
                            "OAuth into the tools you already run and Limelight generates a typed client for each one. A schema change upstream fails your build, not your Friday deploy.",
                            "Describe the workflow and let the model connect your typed tools. Review every step before it runs.",
                            "Give each team the views, permissions and schedules they need. Keep everyone working from the same data.",
                            "Ship a reviewed workflow to production. Every run is observable, versioned and ready to roll back.",
                          ][i]
                        }
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <Console cue={cue + 1} />
          </div>
        </section>
        <section id="lime-features" className="ct-lime-section">
          <h2>Four acts, one console</h2>
          <p>Automation, security, scheduling, and analytics, all on one data model.</p>
          <div className="ct-lime-features">
            {[
              [
                Zap,
                "Automation that learns the run sheet",
                "4x",
                "FASTER CYCLE TIME",
                "Limelight watches the sequences your team repeats and offers to take them over. Approve once and the routine runs on its cue, every step logged.",
              ],
              [
                Shield,
                "Security that survives the audit",
                "SOC 2",
                "TYPE II ALIGNED",
                "Per-field encryption, role-scoped access, and an immutable trail on every mutation. When the review lands, you export evidence instead of assembling it.",
              ],
              [
                Calendar,
                "Scheduling that reads the calendar",
                "38%",
                "LESS HANDOFF LAG",
                "Work lands on whoever has room, in their own hours. The scheduler weighs capacity, timezone, and what is already booked.",
              ],
              [
                BarChart3,
                "Analytics on the live model",
                "1.2s",
                "MEDIAN QUERY",
                "Funnels, retention, and cohorts run on the records your automations touch, not a stale export.",
              ],
            ].map(([Icon, title, value, label, text]) => (
              <article key={String(title)}>
                {typeof Icon !== "string" && <Icon />}
                <h3>{String(title)}</h3>
                <strong>{String(value)}</strong>
                <small>{String(label)}</small>
                <p>{String(text)}</p>
                <div className="ct-feature-art">
                  {String(title).startsWith("Analytics") ? (
                    <div className="ct-feature-bars">
                      {[35, 47, 60, 51, 74, 61, 68, 85, 71, 93, 79, 99].map((n, i) => (
                        <span key={i} style={{ height: n + "%" }} />
                      ))}
                    </div>
                  ) : String(title).startsWith("Scheduling") ? (
                    <div className="ct-feature-week">
                      {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                        <span key={i}>
                          {d}
                          <i style={{ height: ((i % 3) + 1) * 20 + "px" }} />
                        </span>
                      ))}
                    </div>
                  ) : String(title).startsWith("Security") ? (
                    <Shield size={96} />
                  ) : (
                    <div className="ct-feature-auto">
                      <Workflow size={28} />
                      <span>→</span>
                      <span>AUTO</span>
                      <span>→</span>
                      <Zap size={28} />
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
        <LimelightTestimonials />
        <section className="ct-lime-statement">
          <h2>
            Four tools go dark.
            <br />
            The work takes the <span>stage.</span>
          </h2>
          <p>
            Pipelines, automations, and analytics in one workspace.
            <br />
            The glue code hours go back into the product.
          </p>
        </section>
        <section id="lime-pricing" className="ct-lime-section">
          <div className="ct-between">
            <div>
              <h2>One invoice for the whole run</h2>
              <p>
                Every tier is the same platform. What changes is the cast, the volume, and the
                paperwork.
              </p>
            </div>
            <div className="ct-lime-billing">
              <button
                type="button"
                className={!yearly ? "active" : ""}
                onClick={() => setYearly(false)}
              >
                Monthly
              </button>
              <button
                type="button"
                className={yearly ? "active" : ""}
                onClick={() => setYearly(true)}
              >
                Yearly
              </button>
              <small>2 months free</small>
            </div>
          </div>
          <div className="ct-lime-rates">
            {[
              [
                "Starter",
                "First workflows for a small cast. Nothing to configure.",
                29,
                [
                  "5 seats",
                  "3 typed integrations",
                  "1,000 automation runs a month",
                  "Core analytics",
                  "90 days of event history",
                  "Email support",
                ],
              ],
              [
                "Professional",
                "The full platform for a team with production traffic and no patience for glue code.",
                99,
                [
                  "25 seats",
                  "Every integration, typed end to end",
                  "20,000 automation runs a month",
                  "Enrichment on every record",
                  "Funnels, retention, and cohort views",
                  "Full API access",
                  "Custom fields, views, and roles",
                  "Priority support",
                ],
              ],
              [
                "Enterprise",
                "For the org that arrives with procurement, a security review, and its own paper.",
                299,
                [
                  "Unlimited seats",
                  "Unmetered automation runs",
                  "SSO, SCIM, and audit logs",
                  "Per-field encryption controls",
                  "Dedicated infrastructure option",
                  "Guided onboarding",
                  "Net 30 invoicing",
                  "24/7 support with an SLA",
                ],
              ],
            ].map(([name, desc, price, features], i) => (
              <article key={String(name)} className={i === 1 ? "featured" : ""}>
                <h3>{String(name)}</h3>
                {i === 1 && (
                  <small className="ct-professional-caption">WHERE MOST TEAMS LAND</small>
                )}
                <p>{String(desc)}</p>
                <strong>
                  ${yearly ? (Number(price) * 10).toLocaleString() : String(price)}
                  <span>/{yearly ? "year" : "month"}</span>
                </strong>
                <Button
                  className={i === 1 ? "ct-lime-cta" : "ct-lime-outline"}
                  onClick={() => (i === 2 ? scroll("Contact") : setTrial(true))}
                >
                  {i === 2 ? "Talk to sales" : "Start free trial"}
                  <ArrowRight />
                </Button>
                <ul>
                  {(features as string[]).map((f) => (
                    <li key={f}>
                      <Check size={15} />
                      {f}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <p className="ct-lime-price-note">
            {yearly
              ? "Billed once a year. Ten months on the invoice, twelve on the clock."
              : "Per workspace, billed monthly. Move tiers whenever you need to."}
          </p>
        </section>
        <section id="lime-faq" className="ct-lime-section ct-lime-faq">
          <div>
            <h2>Asked at every demo</h2>
            <p>Straight answers on the trial, the invoice, and what it takes to leave.</p>
            <h3>The house desk</h3>
            <p>Anything the program leaves out gets a person, not a macro.</p>
            <Button className="ct-lime-outline" onClick={() => scroll("Contact")}>
              Write to the desk
              <ArrowRight />
            </Button>
          </div>
          <Accordion type="single" collapsible defaultValue="faq-0">
            {[
              "How fast can we actually be in production?",
              "What does the trial include?",
              "Do we have to rip out our current tools first?",
              "What happens when a connected tool changes its schema?",
              "How do plan changes and refunds work?",
              "Where does our data live, and can we take it out?",
              "We have procurement, a security review, and our own paper.",
            ].map((q, i) => (
              <AccordionItem value={"faq-" + i} key={q}>
                <AccordionTrigger>{q}</AccordionTrigger>
                <AccordionContent>
                  {
                    [
                      "First OAuth connection to a live deploy is under five minutes, with your own data rather than a demo set. Most teams wire in the full stack over an afternoon and promote the same day.",
                      "Every feature is available during the 14 day trial. No credit card is required.",
                      "No. Connect your existing tools and introduce workflows at your own pace.",
                      "Typed clients detect schema changes before they reach production. You can review and update each connection.",
                      "Change plans at any time from your billing settings. Contact the crew for help with your invoice.",
                      "Your workspace data can be exported through the API or the console.",
                      "Our enterprise team can work through procurement, security questionnaires, and onboarding with you.",
                    ][i]
                  }
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
        <section className="ct-lime-statement">
          <h2>
            Bring the whole operation
            <br />
            into the <span>light.</span>
          </h2>
          <p>Connect the stack this afternoon. Every feature is on from day one.</p>
          <Button size="lg" className="ct-lime-cta" onClick={() => scroll("Pricing")}>
            Start the free trial
            <ArrowRight />
          </Button>
          <Button size="lg" className="ct-lime-outline ml-3" onClick={() => scroll("Contact")}>
            Book a walkthrough
          </Button>
          <small>14 days · No card required · Cancel from the billing page</small>
        </section>
        <section id="lime-contact" className="ct-lime-section ct-lime-contact">
          <div>
            <h2>
              Talk to the crew
              <br />
              that runs it
            </h2>
            <p>
              Migrations, security questionnaires, or a question the docs did not settle. Messages
              land with the engineers who operate the platform.
            </p>
            <small>EMAIL</small>
            <h3>hello@limelight.app</h3>
            <p>Best for anything with detail. Attachments welcome.</p>
            <small>PHONE</small>
            <h3>+1 (555) 123-4567</h3>
            <p>Monday to Friday, 9 to 6 Pacific.</p>
            <small>OFFICE</small>
            <h3>
              48 Stagehouse Row, Floor 3<br />
              San Francisco, CA 94103
            </h3>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
              toast.success("Message saved in this local demo");
            }}
          >
            <small>BOOKING DESK</small>
            <h3>Replies within one business day</h3>
            {sent ? (
              <div role="status" className="ct-lime-success">
                <Check />
                Your message is ready. Thanks for reaching out.
                <p>This independent demo does not send messages to Limelight.</p>
                <Button type="button" className="ct-lime-outline" onClick={() => setSent(false)}>
                  Write another message
                </Button>
              </div>
            ) : (
              <>
                <label>
                  Name
                  <Input name="name" required />
                </label>
                <label>
                  Email
                  <Input name="email" type="email" required />
                </label>
                <label>
                  Subject
                  <Input name="subject" required />
                </label>
                <label>
                  Message
                  <Textarea name="message" required rows={5} />
                </label>
                <Button type="submit" className="ct-lime-cta">
                  Send message
                  <ArrowRight />
                </Button>
              </>
            )}
          </form>
        </section>
      </main>
      <footer className="ct-lime-footer">
        <div>
          <span className="ct-lime-brand">
            <Zap />
            <b>Limelight</b>
          </span>
          <p>
            One console for your tools, your data,
            <br />
            and the routine work between them.
          </p>
        </div>
        <div>
          {nav.slice(1).map((n) => (
            <button type="button" key={n} onClick={() => scroll(n)}>
              {n}
            </button>
          ))}
        </div>
        <p>© 2026 Limelight · Independent recreation</p>
      </footer>
      <Modal title="Start your free trial" open={trial} onClose={() => setTrial(false)}>
        <form
          className="ct-form"
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Your local demo workspace is ready");
            setTrial(false);
            scroll("Home");
          }}
        >
          <p>14 days. Every feature. No credit card required.</p>
          <label>
            Work email
            <Input type="email" required placeholder="you@company.com" />
          </label>
          <label>
            Workspace name
            <Input required placeholder="Your team" />
          </label>
          <Button type="submit">
            Create demo workspace
            <ArrowRight />
          </Button>
        </form>
      </Modal>
    </div>
  );
}
export default function Marketing({ id }: { id: string }) {
  return id === "overture" ? <Overture /> : <Limelight />;
}
