import type * as React from "react";
import type { HTMLProps } from "@base-ui/react/types";
import { useRender } from "@base-ui/react/use-render";

type ModalPopupState = { open: boolean };
type ModalPopupRender<State extends ModalPopupState> =
  | React.ReactElement
  | ((props: HTMLProps, state: State) => React.ReactElement)
  | undefined;

export function OverlayModalElement<State extends ModalPopupState>({
  elementProps,
  render,
  state,
}: {
  elementProps: HTMLProps;
  render: ModalPopupRender<State>;
  state: State;
}) {
  return useRender({
    defaultTagName: "div",
    render: typeof render === "function" ? (props) => render(props, state) : render,
    props: {
      ...elementProps,
      "data-state": state.open ? "open" : "closed",
      inert: !state.open || undefined,
      "aria-hidden": !state.open || undefined,
    },
  });
}
