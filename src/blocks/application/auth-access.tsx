import { useEffect, useRef, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import { Frame, FramePanel } from "@/components/reui/frame";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PasswordAuthForm } from "./auth-form";
import { AuthSculpture } from "./auth-sculpture";
import "./auth-access.css";

function InviteRequest() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState("");
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSent("");
      }}
    >
      <p className="auth-access-invite">
        Need access?{" "}
        <DialogTrigger asChild>
          <Button variant="link">Request an invite</Button>
        </DialogTrigger>
      </p>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request an invite</DialogTitle>
          <DialogDescription>
            Prepare a local invitation request for your team. No email is sent.
          </DialogDescription>
        </DialogHeader>
        {sent ? (
          <div role="status">
            <Alert>
              <AlertTitle>Request prepared</AlertTitle>
              <AlertDescription>{sent}</AlertDescription>
            </Alert>
            <Button
              className="mt-4"
              onClick={() => {
                setSent("");
                setOpen(false);
              }}
            >
              Back to sign in
            </Button>
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              setSent(
                `${data.get("name")}, your demo request for ${data.get("email")} is ready to review.`,
              );
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="access-name">Full name</FieldLabel>
                <Input id="access-name" name="name" autoComplete="name" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="access-email">Work email</FieldLabel>
                <Input id="access-email" name="email" type="email" autoComplete="email" required />
              </Field>
              <Button type="submit">Prepare request</Button>
            </FieldGroup>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ArtworkCarousel() {
  const [api, setApi] = useState<CarouselApi>();
  const [active, setActive] = useState(0);
  const manual = useRef(false);
  const [autoplay] = useState(() =>
    Autoplay({ delay: 5600, playOnInit: false, stopOnInteraction: true, stopOnMouseEnter: true }),
  );
  useEffect(() => {
    if (!api) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const narrow = matchMedia("(max-width: 700px)");
    const selected = () => setActive(api.selectedScrollSnap());
    const playback = () => {
      if (reduce.matches || narrow.matches || manual.current || document.hidden) autoplay.stop();
      else autoplay.play();
    };
    api.on("select", selected);
    reduce.addEventListener("change", playback);
    narrow.addEventListener("change", playback);
    document.addEventListener("visibilitychange", playback);
    playback();
    return () => {
      api.off("select", selected);
      reduce.removeEventListener("change", playback);
      narrow.removeEventListener("change", playback);
      document.removeEventListener("visibilitychange", playback);
      autoplay.stop();
    };
  }, [api, autoplay]);
  const stop = () => {
    manual.current = true;
    autoplay.stop();
  };
  return (
    <aside className="auth-access-art">
      <div className="auth-access-stack">
        <Carousel
          setApi={setApi}
          plugins={[autoplay]}
          opts={{ loop: true, align: "start" }}
          tabIndex={0}
          aria-label="Original artwork studies"
          onPointerDown={stop}
          onFocusCapture={stop}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") stop();
          }}
        >
          <CarouselContent className="ml-0">
            {[0, 1, 2].map((index) => (
              <CarouselItem key={index} className="pl-0" aria-label={`Artwork ${index + 1}`}>
                <AuthSculpture index={index} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="auth-access-art-controls" aria-label="Choose an artwork">
            {[0, 1, 2].map((index) => (
              <Button
                key={index}
                variant="ghost"
                size="icon-sm"
                aria-label={`Show artwork ${index + 1}`}
                aria-pressed={active === index}
                onClick={() => {
                  stop();
                  api?.scrollTo(index);
                }}
              >
                <span />
              </Button>
            ))}
          </div>
        </Carousel>
      </div>
    </aside>
  );
}

export function CyanArtworkLogin() {
  return (
    <main className="auth-cyan-login">
      <Frame className="auth-cyan-frame">
        <FramePanel>
          <AuthSculpture cyan />
        </FramePanel>
      </Frame>
      <section className="auth-cyan-form">
        <PasswordAuthForm
          title="Sign in to Bricklane"
          description="Make room for your next great idea. Your team is ready when you are."
          magic
          magicArrow
          providers={["Google", "Apple", "GitHub"]}
          providerRow={false}
          signup={false}
        />
      </section>
    </main>
  );
}

export function AccessArtworkLogin() {
  return (
    <main className="auth-access-login">
      <section className="auth-access-form">
        <div>
          <PasswordAuthForm
            title="Sign in to Bricklane Control"
            description=""
            emailOnly
            providers={["Google", "Apple", "GitHub"]}
            providerRow
            signup={false}
          />
          <InviteRequest />
        </div>
      </section>
      <ArtworkCarousel />
    </main>
  );
}
