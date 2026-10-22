import { useId, useState, type MouseEvent, type ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  CircleHelp,
  Clock3,
  Headphones,
  Mail,
  MapPin,
  MessageSquare,
  MessageSquareText,
  LifeBuoy,
  GitFork as Github,
} from "lucide-react";
import type { BlockProps } from "@/data/types";
import { Badge } from "@/components/reui/badge";
import { Frame, FramePanel } from "@/components/reui/frame";
import { IconTile as ReuiIconTile } from "@/components/reui/icon-tile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqContent } from "./marketing-faq-content";
import contactAbstract from "./assets/contact-abstract.jpg";
import "../reference.css";
import "./marketing-contact-faq.css";

// The public demo links target #. Keep those interactions in the preview rather
// than turning a placeholder into an external message or a new product flow.
const stayInPreview = (event: MouseEvent<HTMLAnchorElement>) =>
  event.preventDefault();
function DemoLink({
  children,
  className = "",
  label,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <a
      href="#"
      onClick={stayInPreview}
      className={className}
      aria-label={label}
    >
      {children}
    </a>
  );
}
function SmallBadge({
  children,
  icon = false,
}: {
  children: ReactNode;
  icon?: boolean;
}) {
  return (
    <Badge variant="outline" radius="full" className="rm-badge">
      {icon && <CircleHelp />}
      {children}
    </Badge>
  );
}
function IconTile({ children }: { children: ReactNode }) {
  return <ReuiIconTile variant="elevated" className="rm-icon-tile">{children}</ReuiIconTile>;
}
function PreviewButton({
  children,
  primary = false,
  small = false,
}: {
  children: ReactNode;
  primary?: boolean;
  small?: boolean;
}) {
  return (
    <Button
      type="button"
      variant={primary ? "default" : "outline"}
      className={`rm-button ${small ? "rm-button-small" : ""}`}
    >
      {children}
    </Button>
  );
}

type Question = { q: string; answer: string };
function AnswerList({
  items,
  multiple = false,
  cards = false,
}: {
  items: Question[];
  multiple?: boolean;
  cards?: boolean;
}) {
  const rows = items.map((item) => (
    <AccordionItem
      value={item.q}
      key={item.q}
      className={cards ? "rm-answer-card" : "rm-answer-row"}
    >
      <AccordionTrigger className="rm-answer-trigger">
        <span>{item.q}</span>
      </AccordionTrigger>
      <AccordionContent className="rm-answer-content">
        {item.answer}
      </AccordionContent>
    </AccordionItem>
  ));
  return multiple ? (
    <Accordion
      type="multiple"
      defaultValue={[items[0].q]}
      className={cards ? "rm-answer-cards" : "rm-answer-list"}
    >
      {rows}
    </Accordion>
  ) : (
    <Accordion
      type="single"
      collapsible
      defaultValue={items[0].q}
      className="rm-answer-list"
    >
      {rows}
    </Accordion>
  );
}
export function FAQ({ block }: BlockProps) {
  const n = block.index + 1;
  const [topic, setTopic] = useState("All");
  const all = faqContent[String(n) as keyof typeof faqContent];
  const selected =
    topic === "Getting Started"
      ? all.slice(0, 3)
      : topic === "Licensing"
        ? all.slice(3, 5)
        : topic === "Updates"
          ? all.slice(5)
          : all;
  if (n === 1)
    return (
      <div className="reui-reference rm-surface rm-faq rm-faq-1">
        <section aria-label={block.name} className="rm-faq-section">
          <aside className="rm-faq-intro-sticky">
            <div className="rm-intro">
              <SmallBadge icon>FAQs</SmallBadge>
              <h2>Answers Before You Ship</h2>
              <p>
                Everything teams check when
                <br className="rm-desktop-break" /> moving ReUI blocks to
                production.
              </p>
            </div>
            <div className="rm-intro-support">
              <p>
                Not covered here? A real engineer answers implementation
                questions directly.
              </p>
              <PreviewButton small>
                <MessageSquareText />
                Talk to support
              </PreviewButton>
            </div>
          </aside>
          <div className="rm-faq-questions">
            <Tabs value={topic} onValueChange={setTopic}>
              <TabsList
                variant="line"
                aria-label="Filter questions by topic"
                className="rm-topic-tabs"
              >
                {["All", "Getting Started", "Licensing", "Updates"].map(
                  (label) => (
                    <TabsTrigger key={label} value={label}>
                      {label}
                    </TabsTrigger>
                  ),
                )}
              </TabsList>
            </Tabs>
            <AnswerList key={topic} items={selected} multiple cards />
          </div>
        </section>
      </div>
    );
  if (n === 2)
    return (
      <div className="reui-reference rm-surface rm-faq rm-faq-2">
        <section aria-label={block.name} className="rm-faq-section">
          <div className="rm-intro">
            <SmallBadge>FAQs</SmallBadge>
            <div>
              <h2>Questions Teams Ask</h2>
              <p>
                Straight answers about adapting, owning,
                <br className="rm-desktop-break" /> and shipping ReUI blocks to
                production.
              </p>
            </div>
          </div>
          <div className="rm-two-answer-columns">
            <AnswerList items={all.slice(0, 3)} multiple />
            <AnswerList items={all.slice(3)} multiple />
          </div>
          <Frame className="rm-frame rm-dotted-support">
            <FramePanel fit className="rm-frame-panel rm-support-row">
              <div className="rm-support-copy">
                <IconTile>
                  <MessageSquareText />
                </IconTile>
                <div>
                  <strong>Still have a question?</strong>
                  <p>
                    Bring your edge case to review and map it to one block and
                    one owner.
                  </p>
                </div>
              </div>
              <PreviewButton small>Book a review</PreviewButton>
            </FramePanel>
          </Frame>
        </section>
      </div>
    );
  if (n === 3)
    return (
      <div className="reui-reference rm-surface rm-faq rm-faq-3">
        <section aria-label={block.name} className="rm-faq-section">
          <div className="rm-intro">
            <span className="rm-eyebrow">FAQ</span>
            <h2>Questions, Answered</h2>
            <p>
              Straight answers on source ownership, the shadcn stack, licensing,
              and getting blocks into your product.
            </p>
          </div>
          <div className="rm-open-answers">
            {all.map((item) => (
              <div key={item.q}>
                <h3>{item.q}</h3>
                <p>{item.answer}</p>
              </div>
            ))}
          </div>
          <div className="rm-support-row">
            <div className="rm-support-copy">
              <IconTile>
                <LifeBuoy />
              </IconTile>
              <div>
                <strong>Still have a question?</strong>
                <p>Reach the team or dig into the docs.</p>
              </div>
            </div>
            <div className="rm-support-actions">
              <PreviewButton small>
                <LifeBuoy />
                Support Desk
              </PreviewButton>
              <DemoLink>
                Read Docs
                <ArrowRight />
              </DemoLink>
            </div>
          </div>
        </section>
      </div>
    );
  if (n === 4)
    return (
      <div className="reui-reference rm-surface rm-faq rm-faq-4">
        <section aria-label={block.name} className="rm-faq-section">
          <div className="rm-intro">
            <span className="rm-eyebrow">
              <CircleHelp />
              Support
            </span>
            <h2>Questions, Answered</h2>
            <p>
              The practical details teams check before building production
              screens with ReUI blocks, from customizing primitives to ongoing
              updates.
            </p>
          </div>
          <AnswerList items={all} />
          <p className="rm-team-footer">
            Still have a question?{" "}
            <DemoLink>
              Talk to the team
              <ArrowRight />
            </DemoLink>
          </p>
        </section>
      </div>
    );
  if (n === 5)
    return (
      <div className="reui-reference rm-surface rm-faq rm-faq-5">
        <section aria-label={block.name} className="rm-faq-section">
          <div className="rm-intro">
            <SmallBadge icon>FAQ</SmallBadge>
            <h2>Everything Before Launch</h2>
            <p>What teams ask when adopting ReUI blocks in production.</p>
          </div>
          <div className="rm-side-support-layout">
            <div className="rm-question-panel">
              <AnswerList items={all} />
            </div>
            <aside className="rm-support-sidecard">
              <IconTile>
                <LifeBuoy />
              </IconTile>
              <div>
                <strong>Still Have Questions?</strong>
                <p>
                  Tell us your stack and timeline. A real engineer replies
                  within a business day.
                </p>
              </div>
              <PreviewButton primary small>
                <MessageSquareText />
                Talk to Support
              </PreviewButton>
              <div className="rm-email-fallback">
                <Mail />
                <span>
                  Prefer email? <DemoLink>support@reui.dev</DemoLink>
                </span>
              </div>
            </aside>
          </div>
        </section>
      </div>
    );
  return (
    <div className="reui-reference rm-surface rm-faq rm-faq-6">
      <section aria-label={block.name} className="rm-faq-section">
        <div className="rm-intro">
          <h2>Questions, Answered</h2>
          <p>
            Practical answers on production use, theming, licensing, and
            support.
          </p>
        </div>
        <Frame className="rm-frame rm-faq-tray">
          <FramePanel fit className="rm-frame-panel rm-tray-answers">
            <AnswerList items={all} />
          </FramePanel>
          <FramePanel fit className="rm-frame-panel rm-tray-footer rm-support-row">
            <div className="rm-support-copy">
              <IconTile>
                <MessageSquareText />
              </IconTile>
              <div>
                <strong>Still Have A Question?</strong>
                <p>
                  Bring your edge case to the team and we will map it to one
                  block and one owner.
                </p>
              </div>
            </div>
            <div className="rm-support-actions">
              <PreviewButton small>
                <BookOpen />
                Read The Docs
              </PreviewButton>
              <PreviewButton primary small>
                <Mail />
                Contact Support
              </PreviewButton>
            </div>
          </FramePanel>
        </Frame>
      </section>
    </div>
  );
}

const offices = [
  {
    city: "Austin",
    country: "United States",
    street: "98 San Jacinto Blvd, Suite 400",
    address: "Austin, TX 78701",
    utc: "UTC-6",
    hours: "Mon to Fri, 9 to 6 CST",
  },
  {
    city: "Berlin",
    country: "Germany",
    street: "Torstrasse 120",
    address: "10119 Berlin",
    utc: "UTC+1",
    hours: "Mon to Fri, 9 to 6 CET",
  },
  {
    city: "Tokyo",
    country: "Japan",
    street: "2-11-3 Meguro",
    address: "Meguro City, 153-0063",
    utc: "UTC+9",
    hours: "Mon to Fri, 10 to 7 JST",
  },
];
function ContactPanel({ topic = false }: { topic?: boolean }) {
  const id = useId();
  return (
    <div
      className={`rm-contact-art ${topic ? "rm-contact-photo" : "rm-contact-scope"}`}
    >
      {topic ? (
        <>
          <img src={contactAbstract} alt="Studio workspace" />
          <div className="rm-photo-shade" />
        </>
      ) : (
        <svg
          className="rm-scope-art"
          viewBox="0 0 576 723"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#030712" />
              <stop offset=".22" stopColor="#110631" />
              <stop offset=".55" stopColor="#4b1df4" />
              <stop offset="1" stopColor="#302da6" />
            </linearGradient>
            <pattern
              id={`${id}-dots`}
              width="12"
              height="12"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r=".7" fill="white" fillOpacity=".33" />
            </pattern>
          </defs>
          <path d="M0 0H576V723H0Z" fill={`url(#${id}-g)`} />
          <path
            d="M0 245Q140 95 270 205T576 170V723H0Z"
            fill="#000018"
            opacity=".12"
          />
          <path
            d="M0 435Q130 380 250 465T576 450V723H0Z"
            fill="#190c6c"
            opacity=".55"
          />
          <path d="M0 0H576V723H0Z" fill={`url(#${id}-dots)`} />
        </svg>
      )}
      <div className="rm-art-inner">
        <div>
          <SmallBadge>{topic ? "Contact Desk" : "Scope Desk"}</SmallBadge>
          <h2>
            {topic ? (
              <>
                Reach A<br />
                Real Team
              </>
            ) : (
              <>
                Got A Launch
                <br />
                In Motion?
              </>
            )}
          </h2>
        </div>
        <footer>
          <p>
            {topic
              ? "Questions, access issues, feedback, and partnership notes all land with someone who can move the conversation forward."
              : "Plan adoption, registry setup, and launch polish before work drifts."}
          </p>
          <div className="rm-art-links">
            <a href={`mailto:${topic ? "hello" : "studio"}@reui.example`}>
              <Mail />
              {topic ? "hello" : "studio"}@reui.example
            </a>
            <a href="tel:+14155550184">
              <Headphones />
              +1 415 555 0184
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
function ContactForm({ mode }: { mode: "brief" | "topic" | "short" }) {
  const id = useId();
  const [project, setProject] = useState(""),
    [timeline, setTimeline] = useState(""),
    [topic, setTopic] = useState("");
  const field = (
    label: string,
    name: string,
    placeholder: string,
    type = "text",
  ) => (
    <div className="rm-field">
      <label htmlFor={`${id}-${name}`}>{label}</label>
      <Input
        id={`${id}-${name}`}
        name={name}
        type={type}
        placeholder={placeholder}
      />
    </div>
  );
  const choice = (
    label: string,
    value: string,
    setValue: (value: string) => void,
    items: string[],
    placeholder: string,
  ) => (
    <div className="rm-field">
      <label htmlFor={`${id}-${label}`}>{label}</label>
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger id={`${id}-${label}`} aria-label={label}>
          <SelectValue placeholder={placeholder}>
            {value || placeholder}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="reui-reference">
          {" "}
          <SelectGroup>
            {items.map((text) => (
              <SelectItem
                key={text}
                value={text.toLowerCase().replaceAll(" ", "-")}
              >
                {text}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
  return (
    <form
      className={`rm-contact-form rm-form-${mode}`}
      onSubmit={(event) => {
        event.preventDefault();
        event.currentTarget.reset();
        setProject("");
        setTimeline("");
        setTopic("");
      }}
    >
      <div className="rm-fields">
        {mode === "topic" ? (
          <div className="rm-field-pair">
            {field("Name", "name", "Mira")}
            {field("Email", "email", "mira@northstar.co", "email")}
          </div>
        ) : (
          <>
            <div className="rm-field-pair">
              {field(
                mode === "short" ? "First name" : "First Name",
                "first-name",
                mode === "short" ? "Jordan" : "Mira",
              )}
              {field(
                mode === "short" ? "Last name" : "Last Name",
                "last-name",
                mode === "short" ? "Reyes" : "Stone",
              )}
            </div>
            {field(
              mode === "short" ? "Work email" : "Work Email",
              "email",
              mode === "short" ? "jordan@studio.co" : "mira@northstar.co",
              "email",
            )}
          </>
        )}
        {mode === "brief" ? (
          <>
            <div className="rm-field-pair">
              {field("Company", "company", "Northstar Labs")}
              {choice(
                "Project Type",
                project,
                setProject,
                [
                  "Product launch",
                  "Design system",
                  "Registry setup",
                  "Block customization",
                  "Team license",
                ],
                "Choose a surface",
              )}
            </div>
            <div className="rm-field-pair">
              <div className="rm-field">
                <label htmlFor={`${id}-budget`}>Project Budget</label>
                <div className="rm-budget">
                  <span>$</span>
                  <Input
                    id={`${id}-budget`}
                    name="budget"
                    inputMode="decimal"
                    placeholder="25,000 to 75,000"
                  />
                </div>
              </div>
              {choice(
                "Timeline",
                timeline,
                setTimeline,
                [
                  "This month",
                  "Next 30 days",
                  "This quarter",
                  "Still exploring",
                ],
                "Choose timing",
              )}
            </div>
          </>
        ) : mode === "topic" ? (
          <>
            {choice(
              "Topic",
              topic,
              setTopic,
              [
                "Product question",
                "Account or license",
                "Implementation help",
                "Partnership",
                "Press or media",
              ],
              "Choose a topic",
            )}
            {field("Subject", "subject", "How can we help?")}
          </>
        ) : (
          field("Company", "company", "Studio name")
        )}
        <div className="rm-field">
          <label htmlFor={`${id}-message`}>
            {mode === "brief" ? "Project Details" : "Message"}
          </label>
          <Textarea
            id={`${id}-message`}
            name="message"
            placeholder={
              mode === "brief"
                ? "What are you launching, what is blocked, and what should we review?"
                : mode === "short"
                  ? "Tell us a little about what you are building."
                  : "Your message"
            }
          />
        </div>
      </div>
      <Button type="submit" className="rm-button rm-submit">
        {mode === "brief" ? "Send Project Brief" : "Send Message"}
        {mode === "short" && <ArrowRight />}
      </Button>
      {mode === "short" && (
        <p className="rm-consent">
          Sending this means you accept our <DemoLink>Terms</DemoLink> and{" "}
          <DemoLink>Privacy Policy</DemoLink>.
        </p>
      )}
    </form>
  );
}
function OfficeGrain() {
  const id = useId();
  return <svg className="rm-office-grain" aria-hidden="true">
    <filter id={id}>
      <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="5" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
      <feComponentTransfer>
        <feFuncR type="linear" slope="0.08" />
        <feFuncG type="linear" slope="0.08" />
        <feFuncB type="linear" slope="0.08" />
      </feComponentTransfer>
    </filter>
    <rect width="100%" height="100%" filter={`url(#${id})`} opacity="0.28" />
  </svg>;
}
export function Contact({ block }: BlockProps) {
  const n = block.index + 1;
  if (n === 1)
    return (
      <div className="reui-reference rm-surface rm-contact rm-contact-1">
        <section aria-label={block.name}>
          <div className="rm-intro">
            <span className="rm-eyebrow">Help &amp; Contact</span>
            <h1>We're here to help</h1>
            <p>
              Need assistance with your ReUI kit, have questions about
              licensing, or want to upgrade your plan? We'll guide you through
              the process.
            </p>
          </div>
          <Frame className="rm-frame rm-mail-frame">
            <FramePanel fit className="rm-frame-panel rm-mail-item">
              <Mail />
              <div>
                <strong>Contact us</strong>
                <p>For all requests contact us directly via email.</p>
              </div>
            </FramePanel>
            <footer>
              <Button
                type="button"
                variant="outline"
                className="rm-button"
                aria-label="Contact support at hello@reui.io"
              >
                hello@reui.io
              </Button>
            </footer>
          </Frame>
        </section>
      </div>
    );
  if (n === 2 || n === 3)
    return (
      <div className={`reui-reference rm-surface rm-contact rm-contact-${n}`}>
        <section aria-label={block.name} className="rm-contact-split">
          <div className="rm-form-pane">
            <div className="rm-intro">
              <SmallBadge>
                {n === 2 ? "Project Inquiry" : "Contact Us"}
              </SmallBadge>
              <h1>{n === 2 ? "Start A Project" : "Tell Us What You Need"}</h1>
              <p>
                {n === 2 ? (
                  "Share the essentials. We will route the note and send a practical next step."
                ) : (
                  <>
                    Send a short note with the context, topic, or blocker.
                    <br />
                    We will route it to the right person with a useful next
                    step.
                  </>
                )}
              </p>
            </div>
            <ContactForm mode={n === 2 ? "brief" : "topic"} />
          </div>
          <ContactPanel topic={n === 3} />
        </section>
      </div>
    );
  if (n === 4)
    return (
      <div className="reui-reference rm-surface rm-contact rm-contact-4">
        <OfficeGrain />
        <section aria-label={block.name}>
          <header>
            <div className="rm-intro">
              <span className="rm-eyebrow">Offices</span>
              <h2>Find Us Around The World</h2>
              <p>
                Three studios across three timezones, so there is usually
                someone on the team online when you are.
              </p>
            </div>
            <div className="rm-office-actions">
              <DemoLink label="Email the ReUI team at hello@reui.io">
                <Mail />
                hello@reui.io
              </DemoLink>
              <PreviewButton primary>
                Talk to us
                <ArrowRight />
              </PreviewButton>
            </div>
          </header>
          <div className="rm-offices">
            {offices.map((office) => (
              <div className="rm-office" key={office.city}>
                <div>
                  <h3>{office.city}</h3>
                  <p>{office.country}</p>
                </div>
                <address>
                  {office.street}
                  <br />
                  {office.address}
                </address>
                <p className="rm-office-hours">
                  <Clock3 />
                  <span>
                    <b>{office.utc}</b> · {office.hours}
                  </span>
                </p>
                <DemoLink label={`Get directions to the ${office.city} office`}>
                  Get directions
                  <ArrowRight />
                </DemoLink>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  if (n === 5)
    return (
      <div className="reui-reference rm-surface rm-contact rm-contact-5">
        <section aria-label={block.name} className="rm-inquiry-card">
          <aside>
            <div className="rm-intro">
              <span className="rm-eyebrow">Contact</span>
              <h2>
                Let's Build Your
                <br />
                Next Interface
              </h2>
              <p>
                Tell us what you are building and the team behind ReUI will
                point you in the right direction.
              </p>
            </div>
            <div className="rm-contact-methods">
              {[
                { icon: Mail, label: "Email", text: "hello@reui.io" },
                {
                  icon: Clock3,
                  label: "Response time",
                  text: "Within one business day",
                },
                { icon: MapPin, label: "Studio", text: "San Francisco, CA" },
              ].map((method) => (
                <div key={method.label}>
                  <method.icon />
                  <div>
                    <span>{method.label}</span>
                    <strong>{method.text}</strong>
                  </div>
                </div>
              ))}
            </div>
            <p className="rm-self-serve">
              Prefer to self-serve?{" "}
              <DemoLink>Browse the documentation</DemoLink>
            </p>
          </aside>
          <div className="rm-inquiry-form-pane">
            <div>
              <h3>Tell Us About Your Project</h3>
              <p>
                Share a few details and a real person gets back to you soon.
              </p>
            </div>
            <ContactForm mode="short" />
          </div>
        </section>
      </div>
    );
  return (
    <div className="reui-reference rm-surface rm-contact rm-contact-6">
      <section aria-label={block.name}>
        <div className="rm-intro">
          <h2>Talk To The Team</h2>
          <p>
            Reach us however works best for you. A real person is always glad to
            help.
          </p>
        </div>
        <Frame className="rm-frame rm-channel-frame">
          <div className="rm-channels">
            {[
              {
                title: "Live Chat",
                icon: MessageSquare,
                text: "Chat with the team in real time, Monday to Friday.",
                action: "Start a chat",
                label: "Start a live chat with the ReUI team",
              },
              {
                title: "Email Us",
                icon: Mail,
                text: "Send a note and a real person replies within a business day.",
                action: "hello@reui.io",
                label: "Email the ReUI team at hello@reui.io",
              },
              {
                title: "Community",
                icon: Github,
                text: "Ask questions and share what you build with other developers.",
                action: "Join the discussion",
                label: "Join the ReUI community on GitHub",
              },
            ].map((channel) => (
              <FramePanel fit className="rm-frame-panel rm-channel" key={channel.title}>
                <IconTile>
                  <channel.icon />
                </IconTile>
                <div>
                  <h3>{channel.title}</h3>
                  <p>{channel.text}</p>
                </div>
                <DemoLink label={channel.label}>
                  {channel.action}
                  <ArrowRight />
                </DemoLink>
              </FramePanel>
            ))}
          </div>
        </Frame>
        <div className="rm-channel-docs">
          <div>
            <h3>Still Have Questions?</h3>
            <p>
              The docs and FAQ cover installation, theming, and every block in
              the library.
            </p>
          </div>
          <div>
            <PreviewButton primary>
              Read the Docs
              <ArrowRight />
            </PreviewButton>
            <PreviewButton>Browse the FAQ</PreviewButton>
          </div>
        </div>
      </section>
    </div>
  );
}
