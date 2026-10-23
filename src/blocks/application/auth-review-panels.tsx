import type { ReactNode } from "react";
import { Frame, FramePanel } from "@/components/reui/frame";
import { Rating } from "@/components/reui/rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PasswordAuthForm } from "./auth-form";
import { demoAvatar, integrationArtwork, svgImage } from "@/lib/demo-artwork";
import "./auth-review-panels.css";

type ReviewVariant = 10 | 11 | 18;

function CustomerMarks() {
  return (
    <ul className="growth-customer-marks" aria-label="Demo customer teams">
      {["Northline", "Orbit", "Fieldwork", "Meridian", "Parallel", "Monograph"].map((name) => (
        <li key={name}>
          <img src={svgImage(integrationArtwork(name[0], "#404040"))} alt="" />
          <span>{name}</span>
        </li>
      ))}
    </ul>
  );
}

function CustomerReview({ variant }: { variant: ReviewVariant }) {
  return (
    <aside className={`night-customer-review night-review-${variant}`}>
      <figure>
        <Rating rating={5} role="img" aria-label="5 out of 5 stars" />
        <blockquote>
          {variant === 10
            ? "A shared foundation gives our team more time for the work that matters."
            : variant === 11
              ? "Thoughtful details make every day a little easier for our team."
              : "A thoughtful foundation for teams building what comes next."}
        </blockquote>
        <figcaption>
          <Avatar>
            <AvatarImage src={demoAvatar("alex-chen")} alt="" />
            <AvatarFallback>AC</AvatarFallback>
          </Avatar>
          <strong>Alex Chen</strong>
          <span>Founder, Northline</span>
        </figcaption>
      </figure>
      <div className="night-review-brands">
        {variant !== 10 && <p>Trusted by leading teams</p>}
        <CustomerMarks />
      </div>
    </aside>
  );
}

function SplitContents({ variant }: { variant: ReviewVariant }) {
  const review = <CustomerReview variant={variant} />;
  const form = (
    <section className="night-login-form">
      <PasswordAuthForm
        title="Sign in to Bricklane"
        description={variant === 10 ? "" : "Welcome back."}
        magic={variant === 10}
        providers={variant === 10 ? ["Google", "Apple", "GitHub"] : ["Google", "Apple"]}
        providerRow={variant !== 10}
        signup={variant !== 10}
        outlinedLogo={variant === 18}
        wordmark={variant === 11}
      />
    </section>
  );
  return (
    <>
      {variant === 18 && review}
      {form}
      {variant === 10 ? (
        <Frame className="night-review-frame">
          <FramePanel>{review}</FramePanel>
        </Frame>
      ) : variant === 11 ? (
        review
      ) : null}
    </>
  );
}

/** Consumer layouts composed from the actual official free Frame and Rating. */
export function NightReviewLogin({ variant }: { variant: ReviewVariant }) {
  let content: ReactNode = <SplitContents variant={variant} />;
  if (variant === 11) {
    content = (
      <Frame className="night-outer-frame">
        <FramePanel>{content}</FramePanel>
        <span aria-hidden="true" className="night-frame-corner night-frame-corner-left">
          +
        </span>
        <span aria-hidden="true" className="night-frame-corner night-frame-corner-right">
          +
        </span>
      </Frame>
    );
  }
  return <main className={`auth-night-review auth-night-${variant}`}>{content}</main>;
}
