import { useState, type CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import { Frame, FramePanel } from "@/components/reui/frame";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AuthMark } from "./auth-shared";
import { PasswordAuthForm } from "./auth-form";
import { CustomerMarks, LegalLinks } from "./auth-growth";
import team from "./assets/auth-editorial/team-workspace.jpg";
import office from "./assets/auth-editorial/office-backdrop.jpg";
import "./auth-editorial.css";

export function FounderStoryLogin() {
  const [story, setStory] = useState(false);
  return (
    <main className="auth-editorial auth-founder-login">
      <section className="auth-editorial-login">
        <header className="auth-editorial-brand">
          <AuthMark wordmark />
        </header>
        <div className="auth-editorial-form">
          <PasswordAuthForm title="Sign in to ReUI" description="Welcome back." logo={false} />
        </div>
        <LegalLinks />
      </section>
      <aside className="auth-founder-story">
        <div className="auth-founder-photo">
          <AspectRatio ratio={3 / 2}>
            <img src={team} alt="A team collaborating around a shared workspace" />
          </AspectRatio>
        </div>
        <figure>
          <strong className="auth-founder-wordmark">
            <span aria-hidden="true">✣</span>slack
          </strong>
          <blockquote>
            “A shared foundation helps our team focus on the work that moves us forward.”
          </blockquote>
          <Button variant="link" onClick={() => setStory(true)}>
            Read more <ArrowUpRight />
          </Button>
        </figure>
        <CustomerMarks />
      </aside>
      <Dialog open={story} onOpenChange={setStory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Building better, together</DialogTitle>
            <DialogDescription>
              A sample customer story for this component preview.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm leading-7 text-muted-foreground">
            A small team brings design and development into the same workspace. Shared components
            leave more time for customer feedback, careful decisions, and the details that make
            their own product useful.
          </p>
          <Button onClick={() => setStory(false)}>Back to sign in</Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export function PhotoBackdropLogin() {
  const [account, setAccount] = useState(false);
  return (
    <main
      className="auth-editorial auth-photo-backdrop"
      style={{ "--auth-backdrop": `url(${office})` } as CSSProperties}
    >
      <header className="growth-page-header">
        <AuthMark wordmark />
        <Button variant="outline" className="rounded-full" onClick={() => setAccount(true)}>
          Need an account? Sign up
        </Button>
      </header>
      <Frame className="auth-backdrop-frame">
        <FramePanel>
          <PasswordAuthForm
            title="Sign in to ReUI"
            description="Welcome back. Let's get you signed in."
            logo={false}
            providerRow={false}
          />
        </FramePanel>
      </Frame>
      <p className="auth-backdrop-trust">Trusted by 14,000+ teams and makers worldwide</p>
      <Dialog open={account} onOpenChange={setAccount}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create your account</DialogTitle>
            <DialogDescription>Explore a local account form.</DialogDescription>
          </DialogHeader>
          <PasswordAuthForm logo={false} initialMode="signup" />
        </DialogContent>
      </Dialog>
    </main>
  );
}
