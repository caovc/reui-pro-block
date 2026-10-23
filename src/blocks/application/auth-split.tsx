import { useEffect, useRef, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Rating } from "@/components/reui/rating";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { demoAvatar } from "@/lib/demo-artwork";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Frame, FramePanel } from "@/components/reui/frame";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { BlockProps } from "@/data/types";
import { AuthMark } from "./auth-shared";
import { PasswordAuthForm } from "./auth-form";
import "./auth-split.css";

function FluidArtwork() {
  return (
    <svg
      viewBox="0 0 600 720"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Abstract flowing pale blue sheets"
      className="auth-fluid-art"
    >
      <defs>
        <linearGradient id="auth-fluid-bg" x2=".8" y2="1">
          <stop stopColor="#e7edf2" />
          <stop offset=".5" stopColor="#d3e2ef" />
          <stop offset="1" stopColor="#e8edf4" />
        </linearGradient>
        <linearGradient id="auth-fluid-sheet" x1="0" x2="1" y2=".25">
          <stop stopColor="#f7f9fb" stopOpacity=".1" />
          <stop offset=".7" stopColor="#eef5fa" stopOpacity=".2" />
          <stop offset="1" stopColor="#fff" stopOpacity=".72" />
        </linearGradient>
        <linearGradient id="auth-fluid-fold" x1="0" y1="0" x2="1" y2=".35">
          <stop stopColor="#fff" stopOpacity=".8" />
          <stop offset=".28" stopColor="#eef5fb" stopOpacity=".35" />
          <stop offset="1" stopColor="#b7cfe4" stopOpacity=".1" />
        </linearGradient>
        <filter id="auth-fluid-soft">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <path fill="url(#auth-fluid-bg)" d="M0 0h600v720H0z" />
      <path d="M40-80C220 90 260 420 105 720L-60 780V-80Z" fill="url(#auth-fluid-sheet)" />
      <path
        d="M40-80C220 90 260 420 105 720"
        fill="none"
        stroke="#fff"
        strokeOpacity=".6"
        strokeWidth="3"
      />
      <path d="M150-70C310 100 468 367 443 790L730 790V50Z" fill="url(#auth-fluid-fold)" />
      <path
        d="M150-70C310 100 468 367 443 790"
        fill="none"
        stroke="#fff"
        strokeOpacity=".6"
        strokeWidth="5"
      />
      <path
        d="M-80 460C100 310 280 468 650 280"
        fill="none"
        stroke="#fff"
        strokeOpacity=".3"
        strokeWidth="24"
        filter="url(#auth-fluid-soft)"
      />
      <path
        d="M-80 460C100 310 280 468 650 280"
        fill="none"
        stroke="#fff"
        strokeOpacity=".38"
        strokeWidth="2"
      />
      <path
        d="M300-40C420 90 570 52 680 220"
        fill="none"
        stroke="#fff"
        strokeOpacity=".35"
        strokeWidth="3"
      />
    </svg>
  );
}
const reviews = [
  {
    name: "Sarah Chen",
    role: "Founder, Cloudline",
    initials: "SC",
    quote:
      "Our team went from an idea to a polished workspace in days. Every screen feels considered.",
    detail: "We can spend more time on the work our customers actually need.",
  },
  {
    name: "Marcus Reid",
    role: "Product Lead, Orbit",
    initials: "MR",
    quote: "A reliable foundation makes a real difference when a small team has a lot to build.",
    detail: "The consistent details help us move quickly and keep the product feeling familiar.",
  },
  {
    name: "Olivia Martin",
    role: "Co-founder, Layers",
    initials: "OM",
    quote: "It feels like our whole team is finally working from the same page.",
    detail: "From the first sign-in to our daily workflow, everything is clear and easy to find.",
  },
  {
    name: "David Park",
    role: "Designer, Northstar",
    initials: "DP",
    quote: "Simple, thoughtful interfaces give us space to focus on our own product.",
    detail: "The little details add up to an experience we're proud to share with our customers.",
  },
  {
    name: "Emma Wilson",
    role: "Founder, Frame",
    initials: "EW",
    quote: "We found a workflow that fits the way our team already thinks and collaborates.",
    detail:
      "Getting started was straightforward, and each new feature feels like part of the same system.",
  },
  {
    name: "Alex Morgan",
    role: "Engineering Lead, Nova",
    initials: "AM",
    quote: "A solid starting point for a team that values both speed and careful design.",
    detail: "We shipped our first version with confidence and kept improving from there.",
  },
];
// Actual free REUI c-carousel-5 Autoplay and c-carousel-11 API/dot patterns.
function ReviewCarousel() {
  const [api, setApi] = useState<CarouselApi>();
  const [active, setActive] = useState(2);
  const manual = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  const [autoplay] = useState(() =>
    Autoplay({
      delay: 6500,
      playOnInit: false,
      stopOnInteraction: true,
      stopOnMouseEnter: true,
      stopOnFocusIn: true,
    }),
  );
  const photos = reviews.map((review) => demoAvatar(review.name));
  useEffect(() => {
    if (!api) return;
    const plugin = autoplay;
    const selected = () => setActive(api.selectedScrollSnap());
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = window.matchMedia("(max-width: 700px)");
    const updatePlayback = () => {
      if (
        reduced.matches ||
        mobile.matches ||
        manual.current ||
        root.current?.contains(document.activeElement)
      )
        plugin.stop();
      else plugin.play();
    };
    const reinitialized = () => {
      selected();
      updatePlayback();
    };
    selected();
    api.on("select", selected);
    api.on("reInit", reinitialized);
    reduced.addEventListener("change", updatePlayback);
    mobile.addEventListener("change", updatePlayback);
    updatePlayback();
    return () => {
      api.off("select", selected);
      api.off("reInit", reinitialized);
      reduced.removeEventListener("change", updatePlayback);
      mobile.removeEventListener("change", updatePlayback);
      plugin.stop();
    };
  }, [api, autoplay]);
  return (
    <Carousel
      ref={root}
      setApi={setApi}
      opts={{ align: "center", loop: true, startIndex: 2 }}
      plugins={[autoplay]}
      className="auth-review-carousel"
      aria-label="Customer stories"
      tabIndex={0}
      onPointerDown={() => {
        manual.current = true;
        autoplay.stop();
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          manual.current = true;
          autoplay.stop();
        }
      }}
      onMouseLeave={() => {
        if (
          !manual.current &&
          !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
          !root.current?.contains(document.activeElement)
        )
          autoplay.play();
      }}
    >
      <CarouselContent className="auth-review-track" aria-live="off">
        {reviews.map((review, index) => (
          <CarouselItem
            className="auth-review-slide"
            key={review.name}
            aria-label={`Story ${index + 1} of ${reviews.length}`}
          >
            <Card
              className={`auth-review-card ${index === active ? "auth-review-current" : "auth-review-neighbor"}`}
              aria-hidden={index !== active}
            >
              <CardContent>
                <p>{review.quote}</p>
                <p>{review.detail}</p>
                <div className="auth-review-person">
                  <Avatar>
                    <AvatarImage src={photos[index]} alt="" />
                    <AvatarFallback>{review.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <strong>{review.name}</strong>
                    <small>{review.role}</small>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="auth-review-dots" aria-label="Choose a customer story">
        {reviews.map((review, index) => (
          <Button
            key={review.name}
            variant="ghost"
            size="icon"
            className="size-6"
            aria-label={`Show story ${index + 1}`}
            aria-pressed={active === index}
            onClick={() => {
              manual.current = true;
              autoplay.stop();
              api?.scrollTo(index);
            }}
          >
            <span className={active === index ? "active" : ""} />
          </Button>
        ))}
      </div>
    </Carousel>
  );
}
function LegalFooter({ copyright = false }: { copyright?: boolean }) {
  const [document, setDocument] = useState("");
  return (
    <>
      <footer className="auth-split-legal">
        {copyright && <span>Bricklane · Independent demo</span>}
        <nav aria-label="Legal and support">
          {(copyright ? ["Terms", "Privacy", "Help"] : ["Privacy", "Terms", "Status"]).map(
            (label) => (
              <Button variant="link" key={label} onClick={() => setDocument(label)}>
                {label}
              </Button>
            ),
          )}
        </nav>
      </footer>
      <Dialog open={!!document} onOpenChange={(open) => !open && setDocument("")}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{document}</DialogTitle>
            <DialogDescription>
              {document === "Status"
                ? "All demo services are available. This component runs locally."
                : "Example information for this component preview. Replace this text with your own policies and support details."}
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setDocument("")}>Done</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
export default function SplitAuth({ block }: BlockProps) {
  if (block.id === "auth-1")
    return (
      <main className="auth-split-refined auth-blue-split">
        <div className="auth-faint-grid" aria-hidden="true" />
        <section className="auth-blue-form">
          <PasswordAuthForm
            title="Sign in to ReUI"
            description="Welcome back."
            providers={["Google", "Apple"]}
          />
        </section>
        <aside className="auth-blue-panel">
          <FluidArtwork />
        </aside>
      </main>
    );
  if (block.id === "auth-2")
    return (
      <main className="auth-split-refined auth-review-split">
        <aside className="auth-review-panel">
          <div className="auth-wave-lines" aria-hidden="true">
            {Array.from({ length: 18 }, (_, index) => (
              <i
                key={index}
                style={{
                  top: `${35 + index * 2}%`,
                  transform: `rotate(${-12 + index * 0.65}deg)`,
                }}
              />
            ))}
          </div>
          <header>
            <AuthMark wordmark />
            <h2>Access With Trust</h2>
            <p>
              One secure place for your ideas, your team,
              <br />
              and everything you're building next.
            </p>
          </header>
          <ReviewCarousel />
          <div className="auth-trustpilot">
            <div aria-label="5 out of 5 stars">
              {[0, 1, 2, 3, 4].map((n) => (
                <span key={n}>
                  <Star fill="white" />
                </span>
              ))}
              <strong>Trustpilot</strong>
            </div>
            <p>Trusted by 14,800+ founders and teams worldwide</p>
          </div>
        </aside>
        <section className="auth-review-login">
          <PasswordAuthForm
            title="Welcome back"
            description="Enter your credentials to access your workspace."
            logo={false}
          />
          <LegalFooter copyright />
        </section>
      </main>
    );
  if (block.id === "auth-3")
    return (
      <main className="auth-split-refined auth-magic-split">
        <section className="auth-magic-form">
          <PasswordAuthForm
            title="Sign in"
            description="Enter your email to receive a secure magic link."
            magic
            outlinedLogo
            providerRow={false}
            signup={false}
          />
        </section>
        <aside className="auth-magic-review auth-grain">
          <figure>
            <Rating
              className="auth-five-stars"
              rating={5}
              role="img"
              aria-label="5 out of 5 stars"
            />
            <blockquote>
              “A thoughtful foundation for teams
              <br className="hidden xl:block" /> building their next great product.”
            </blockquote>
            <figcaption>
              <strong>Sean</strong>
              <span>Co-founder, ReUI</span>
            </figcaption>
          </figure>
          <div className="auth-trusted-teams">
            <p>Trusted by leading teams</p>
            <ul aria-label="Trusted teams">
              <li>◉ OpenAI</li>
              <li className="font-bold">stripe</li>
              <li>ϟ supabase</li>
              <li className="font-bold">✣ slack</li>
            </ul>
          </div>
        </aside>
      </main>
    );
  return (
    <main className="auth-split-refined auth-framed-password auth-grain">
      <div className="auth-framed-group">
        <Frame className="auth-password-frame">
          <FramePanel className="auth-password-panel">
            <PasswordAuthForm outlinedLogo signup={false} />
          </FramePanel>
        </Frame>
        <SignupOutside />
        <LegalFooter />
      </div>
    </main>
  );
}
function SignupOutside() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <p className="auth-outside-signup">
        Need an account?{" "}
        <Button variant="link" className="h-auto p-0 text-xs" onClick={() => setOpen(true)}>
          Sign up
        </Button>
      </p>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create your account</DialogTitle>
            <DialogDescription>
              Try the local account form. No account is created.
            </DialogDescription>
          </DialogHeader>
          <PasswordAuthForm
            title="Join ReUI"
            description="Create your demo workspace."
            logo={false}
            initialMode="signup"
            signup
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
