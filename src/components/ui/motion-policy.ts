// Bricklane application preference propagation for the existing native controls.
// This is a custom scope adapter, not an official ReUI component replacement.
import { createContext, useContext, type CSSProperties } from "react";

const MotionPolicyContext = createContext(false);

export const MotionPolicyProvider = MotionPolicyContext.Provider;

export function useMotionPolicy() {
  return useContext(MotionPolicyContext);
}

type MotionStyle<State> = CSSProperties | ((state: State) => CSSProperties | undefined) | undefined;

export function mergeMotionStyle(style: CSSProperties | undefined): CSSProperties;
export function mergeMotionStyle<State>(
  style: (state: State) => CSSProperties | undefined,
): (state: State) => CSSProperties;
export function mergeMotionStyle<State>(
  style: MotionStyle<State>,
): CSSProperties | ((state: State) => CSSProperties);
export function mergeMotionStyle<State>(
  style: MotionStyle<State>,
): CSSProperties | ((state: State) => CSSProperties) {
  if (typeof style === "function") {
    return (state: State) => mergeMotionStyle(style(state));
  }
  return {
    ...style,
    animationDuration: "0.01ms",
    animationDelay: "0ms",
    transitionDuration: "0.01ms",
    transitionDelay: "0ms",
  };
}
