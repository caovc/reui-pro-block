import { Fragment } from "react";
import { Banknote, Building2, CreditCard, Wallet } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Frame, FramePanel } from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";
import type { CommerceSettingsModel } from "./commerce-settings-model";

export function CommercePaymentSettings({ model }: { model: CommerceSettingsModel }) {
  return (
    <>
      <header className="csd-page-heading">
        <h1>Payments</h1>
        <Button
          onClick={() =>
            model.announce(
              "Add provider: the provider directory is a demo. No payment provider was added.",
            )
          }
        >
          Add provider
        </Button>
      </header>
      <Frame dense className="csd-frame">
        <FramePanel fit className="csd-fit-panel">
          <ItemGroup className="csd-provider-list">
            {model.providers.map((provider, index) => {
              const Icon =
                provider.id === "bank"
                  ? Building2
                  : provider.id === "cash"
                    ? Banknote
                    : provider.id === "stripe"
                      ? CreditCard
                      : Wallet;
              return (
                <Fragment key={provider.id}>
                  {index > 0 && <ItemSeparator />}
                  <Item role="listitem">
                    <ItemMedia variant="icon" className="csd-provider-icon">
                      <Icon aria-hidden="true" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>
                        {provider.name}
                        <Badge variant={provider.connected ? "success-light" : "secondary"}>
                          {provider.connected ? "Connected" : "Available"}
                        </Badge>
                      </ItemTitle>
                      <ItemDescription>{provider.description}</ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => model.toggleProvider(provider.id)}
                        aria-label={`${provider.connected ? "Disconnect" : "Connect"} ${provider.name}`}
                      >
                        {provider.connected ? "Disconnect" : "Connect"}
                      </Button>
                    </ItemActions>
                  </Item>
                </Fragment>
              );
            })}
          </ItemGroup>
        </FramePanel>
      </Frame>
    </>
  );
}
