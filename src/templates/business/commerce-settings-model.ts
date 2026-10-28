import { useRef, useState } from "react";
import {
  createCommerceLocations,
  createCommerceMembers,
  createCommerceNotifications,
  createCommerceProviders,
  createCommerceStockRecords,
  createCommerceSuppliers,
  type CommerceInvite,
  type CommerceLocation,
  type CommerceMember,
  type CommerceNotificationChannel,
  type CommerceNotificationTab,
  type CommerceSupplier,
} from "./commerce-settings-data";

const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

/** Parent-mounted, local-only settings data. No payment, invite or message is sent. */
export function useCommerceSettingsModel() {
  const [locations, setLocations] = useState(createCommerceLocations);
  const [suppliers, setSuppliers] = useState(createCommerceSuppliers);
  const [stockRecords, setStockRecords] = useState(createCommerceStockRecords);
  const [members, setMembers] = useState(createCommerceMembers);
  const [providers, setProviders] = useState(createCommerceProviders);
  const [notifications, setNotifications] = useState(createCommerceNotifications);
  const [notificationTab, setNotificationTab] = useState<CommerceNotificationTab>("orders");
  const [notice, setNotice] = useState("");
  const nextLocationId = useRef(104);
  const nextSupplierId = useRef(205);
  const nextMemberId = useRef(13);

  function saveLocation(draft: Omit<CommerceLocation, "id">, id?: number): string | null {
    const next = { ...draft, name: draft.name.trim(), address: draft.address.trim() };
    if (!next.name) return "Enter a location name.";
    if (
      locations.some(
        (entry) => entry.id !== id && entry.name.toLowerCase() === next.name.toLowerCase(),
      )
    ) {
      return "Use a different location name.";
    }
    if (id !== undefined && !locations.some((entry) => entry.id === id)) {
      return "This location no longer exists.";
    }
    const record = { ...next, id: id ?? nextLocationId.current++ };
    setLocations((current) =>
      id === undefined
        ? [...current, record]
        : current.map((entry) => (entry.id === id ? record : entry)),
    );
    setNotice("Location saved in this local preview.");
    return null;
  }

  function saveSupplier(draft: Omit<CommerceSupplier, "id">, id?: number): string | null {
    const next = { ...draft, name: draft.name.trim(), email: draft.email.trim().toLowerCase() };
    if (!next.name) return "Enter a supplier name.";
    if (next.email && !validEmail(next.email)) return "Enter a valid contact email.";
    if (
      suppliers.some(
        (entry) => entry.id !== id && entry.name.toLowerCase() === next.name.toLowerCase(),
      )
    ) {
      return "Use a different supplier name.";
    }
    if (id !== undefined && !suppliers.some((entry) => entry.id === id)) {
      return "This supplier no longer exists.";
    }
    const record = { ...next, id: id ?? nextSupplierId.current++ };
    setSuppliers((current) =>
      id === undefined
        ? [...current, record]
        : current.map((entry) => (entry.id === id ? record : entry)),
    );
    setNotice("Supplier saved in this local preview.");
    return null;
  }

  function removeLocation(id: number) {
    setLocations((current) => current.filter((entry) => entry.id !== id));
    setStockRecords((current) =>
      current.map((entry) => (entry.locationId === id ? { ...entry, locationId: null } : entry)),
    );
    setNotice("Location removed. Its local sample stock is now unassigned.");
  }

  function removeSupplier(id: number) {
    setSuppliers((current) => current.filter((entry) => entry.id !== id));
    setStockRecords((current) =>
      current.map((entry) => (entry.supplierId === id ? { ...entry, supplierId: null } : entry)),
    );
    setNotice("Supplier removed. Its local sample stock is now unassigned.");
  }

  function inviteMembers(invites: readonly CommerceInvite[]): string | null {
    const normalized = invites.map((entry) => ({
      ...entry,
      email: entry.email.trim().toLowerCase(),
    }));
    if (normalized.length === 0 || normalized.some((entry) => !validEmail(entry.email))) {
      return "Enter a valid email for each local invitation.";
    }
    if (new Set(normalized.map((entry) => entry.email)).size !== normalized.length) {
      return "Use a different email for each person.";
    }
    if (
      normalized.some((entry) =>
        members.some((member) => member.email.toLowerCase() === entry.email),
      )
    ) {
      return "A member with this email already exists in this preview.";
    }
    const additions: CommerceMember[] = normalized.map((entry) => ({
      id: nextMemberId.current++,
      name: entry.email.split("@")[0],
      email: entry.email,
      role: entry.role,
      teams: [],
      status: "Invited",
      auth: "Password",
      secondFactor: "No 2FA",
      lastActive: "Local invite created",
    }));
    setMembers((current) => [...current, ...additions]);
    setNotice(
      `${additions.length} local invitation${additions.length === 1 ? "" : "s"} added. No email was sent or access granted.`,
    );
    return null;
  }

  function updateMember(
    id: number,
    patch: Pick<CommerceMember, "name" | "email" | "role" | "status">,
  ): string | null {
    if (!members.some((entry) => entry.id === id)) return "This member no longer exists.";
    const name = patch.name.trim();
    const email = patch.email.trim().toLowerCase();
    if (!name || !validEmail(email)) return "Enter a name and valid email.";
    if (members.some((entry) => entry.id !== id && entry.email.toLowerCase() === email)) {
      return "A member with this email already exists.";
    }
    setMembers((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, ...patch, name, email } : entry)),
    );
    setNotice("Member updated in this local preview; real access is unchanged.");
    return null;
  }

  function removeMember(id: number) {
    setMembers((current) => current.filter((entry) => entry.id !== id));
    setNotice("Member removed from this local preview; real access is unchanged.");
  }

  function toggleProvider(id: string) {
    setProviders((current) =>
      current.map((provider) =>
        provider.id === id ? { ...provider, connected: !provider.connected } : provider,
      ),
    );
    setNotice("Local provider status updated. No payment gateway was connected or disconnected.");
  }

  function setNotification(id: string, channel: CommerceNotificationChannel, checked: boolean) {
    setNotifications((current) =>
      current.map((entry) =>
        entry.id === id ? { ...entry, channels: { ...entry.channels, [channel]: checked } } : entry,
      ),
    );
  }

  function stockCount(kind: "locations" | "suppliers", id: number) {
    return new Set(
      stockRecords
        .filter((entry) =>
          kind === "locations" ? entry.locationId === id : entry.supplierId === id,
        )
        .map((entry) => entry.sku),
    ).size;
  }

  return {
    locations,
    suppliers,
    stockRecords,
    members,
    providers,
    notifications,
    notificationTab,
    setNotificationTab,
    notice,
    announce: setNotice,
    saveLocation,
    saveSupplier,
    removeLocation,
    removeSupplier,
    stockCount,
    inviteMembers,
    updateMember,
    removeMember,
    toggleProvider,
    setNotification,
  };
}

export type CommerceSettingsModel = ReturnType<typeof useCommerceSettingsModel>;
