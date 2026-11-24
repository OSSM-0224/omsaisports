import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { generateNextDesignId } from "../lib/config";
import {
  SEED_CLIENTS,
  SEED_DESIGNS,
  SEED_FACTS,
  SEED_SITE_SETTINGS,
} from "../lib/seedData";
import {
  loadInitialShowcaseData,
  persistClients,
  persistDesigns,
  persistFacts,
  persistSiteSettings,
  resetAllToSeed,
} from "../lib/storage";
import type {
  ClientItem,
  FactItem,
  JerseyDesign,
  SiteSettings,
  ToastMessage,
} from "../types";

interface ShowcaseContextValue {
  designs: JerseyDesign[];
  clients: ClientItem[];
  facts: FactItem[];
  siteSettings: SiteSettings;
  isLoading: boolean;
  activeLightboxDesign: JerseyDesign | null;
  lightboxAutoPrint: boolean;
  openLightbox: (design: JerseyDesign, autoPrintSlip?: boolean) => void;
  closeLightbox: () => void;
  addDesign: (
    input: Omit<JerseyDesign, "id" | "designId" | "createdAt">,
  ) => JerseyDesign;
  updateDesign: (id: string, patch: Partial<JerseyDesign>) => void;
  deleteDesign: (id: string) => void;
  reorderDesign: (id: string, direction: "up" | "down") => void;
  addClient: (client: Omit<ClientItem, "id">) => void;
  removeClient: (id: string) => void;
  updateClient: (id: string, patch: Partial<ClientItem>) => void;
  addFact: (fact: Omit<FactItem, "id">) => void;
  updateFact: (id: string, patch: Partial<FactItem>) => void;
  deleteFact: (id: string) => void;
  updateSiteSettings: (patch: Partial<SiteSettings>) => void;
  resetDemoData: () => void;
  toasts: ToastMessage[];
  pushToast: (text: string, tone?: ToastMessage["tone"]) => void;
  dismissToast: (id: string) => void;
}

const ShowcaseContext = createContext<ShowcaseContextValue | null>(null);

export function ShowcaseProvider({ children }: { children: React.ReactNode }) {
  const [designs, setDesigns] = useState<JerseyDesign[]>(SEED_DESIGNS);
  const [clients, setClients] = useState<ClientItem[]>(SEED_CLIENTS);
  const [facts, setFacts] = useState<FactItem[]>(SEED_FACTS);
  const [siteSettings, setSiteSettings] =
    useState<SiteSettings>(SEED_SITE_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [activeLightboxDesign, setActiveLightboxDesign] =
    useState<JerseyDesign | null>(null);
  const [lightboxAutoPrint, setLightboxAutoPrint] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = useCallback(
    (text: string, tone: ToastMessage["tone"] = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, text, tone }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, 3400);
    },
    [],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    let mounted = true;
    loadInitialShowcaseData().then((data) => {
      if (!mounted) return;
      setDesigns(data.designs);
      setClients(data.clients);
      setFacts(data.facts);
      setSiteSettings(data.siteSettings);
      setIsLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const openLightbox = useCallback(
    (design: JerseyDesign, autoPrintSlip = false) => {
      setLightboxAutoPrint(autoPrintSlip);
      setActiveLightboxDesign(design);
    },
    [],
  );

  const closeLightbox = useCallback(() => {
    setActiveLightboxDesign(null);
    setLightboxAutoPrint(false);
  }, []);

  const addDesign = useCallback(
    (input: Omit<JerseyDesign, "id" | "designId" | "createdAt">) => {
      const nextDesignId = generateNextDesignId(designs.map((d) => d.designId));
      const created: JerseyDesign = {
        ...input,
        id: nextDesignId.toLowerCase(),
        designId: nextDesignId,
        createdAt: new Date().toISOString(),
      };
      const updated = [created, ...designs];
      setDesigns(updated);
      persistDesigns(updated);
      pushToast(`Published ${created.designId} to the Design Wall`, "success");
      return created;
    },
    [designs, pushToast],
  );

  const updateDesign = useCallback(
    (id: string, patch: Partial<JerseyDesign>) => {
      setDesigns((prev) => {
        const updated = prev.map((item) =>
          item.id === id ? { ...item, ...patch } : item,
        );
        persistDesigns(updated);
        return updated;
      });
      pushToast("Design updated", "success");
    },
    [pushToast],
  );

  const deleteDesign = useCallback(
    (id: string) => {
      setDesigns((prev) => {
        const updated = prev.filter((item) => item.id !== id);
        persistDesigns(updated);
        return updated;
      });
      pushToast("Design removed", "info");
    },
    [pushToast],
  );

  const reorderDesign = useCallback((id: string, direction: "up" | "down") => {
    setDesigns((prev) => {
      const idx = prev.findIndex((item) => item.id === id);
      if (idx < 0) return prev;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      persistDesigns(next);
      return next;
    });
  }, []);

  const addClient = useCallback(
    (client: Omit<ClientItem, "id">) => {
      const created: ClientItem = {
        ...client,
        id: `c-${Date.now()}`,
      };
      setClients((prev) => {
        const updated = [created, ...prev];
        persistClients(updated);
        return updated;
      });
      pushToast(`Added ${client.name} to client wall`, "success");
    },
    [pushToast],
  );

  const removeClient = useCallback(
    (id: string) => {
      setClients((prev) => {
        const updated = prev.filter((item) => item.id !== id);
        persistClients(updated);
        return updated;
      });
      pushToast("Client removed", "info");
    },
    [pushToast],
  );

  const updateClient = useCallback(
    (id: string, patch: Partial<ClientItem>) => {
      setClients((prev) => {
        const updated = prev.map((item) =>
          item.id === id ? { ...item, ...patch } : item,
        );
        persistClients(updated);
        return updated;
      });
      pushToast("Client updated", "success");
    },
    [pushToast],
  );

  const addFact = useCallback(
    (fact: Omit<FactItem, "id">) => {
      const created: FactItem = { ...fact, id: `f-${Date.now()}` };
      setFacts((prev) => {
        const updated = [...prev, created];
        persistFacts(updated);
        return updated;
      });
      pushToast("Fact added", "success");
    },
    [pushToast],
  );

  const updateFact = useCallback(
    (id: string, patch: Partial<FactItem>) => {
      setFacts((prev) => {
        const updated = prev.map((item) =>
          item.id === id ? { ...item, ...patch } : item,
        );
        persistFacts(updated);
        return updated;
      });
      pushToast("Fact saved", "success");
    },
    [pushToast],
  );

  const deleteFact = useCallback(
    (id: string) => {
      setFacts((prev) => {
        const updated = prev.filter((item) => item.id !== id);
        persistFacts(updated);
        return updated;
      });
      pushToast("Fact removed", "info");
    },
    [pushToast],
  );

  const updateSiteSettings = useCallback(
    (patch: Partial<SiteSettings>) => {
      setSiteSettings((prev) => {
        const updated: SiteSettings = { ...prev, ...patch };
        persistSiteSettings(updated);
        return updated;
      });
      pushToast("Hero background settings updated", "success");
    },
    [pushToast],
  );

  const resetDemoData = useCallback(() => {
    const fresh = resetAllToSeed();
    setDesigns(fresh.designs);
    setClients(fresh.clients);
    setFacts(fresh.facts);
    setSiteSettings(fresh.siteSettings);
    pushToast("Restored default 12 demo designs & client wall", "info");
  }, [pushToast]);

  return (
    <ShowcaseContext.Provider
      value={{
        designs,
        clients,
        facts,
        siteSettings,
        isLoading,
        activeLightboxDesign,
        lightboxAutoPrint,
        openLightbox,
        closeLightbox,
        addDesign,
        updateDesign,
        deleteDesign,
        reorderDesign,
        addClient,
        removeClient,
        updateClient,
        addFact,
        updateFact,
        deleteFact,
        updateSiteSettings,
        resetDemoData,
        toasts,
        pushToast,
        dismissToast,
      }}
    >
      {children}
    </ShowcaseContext.Provider>
  );
}

export function useShowcaseData(): ShowcaseContextValue {
  const ctx = useContext(ShowcaseContext);
  if (!ctx) {
    throw new Error("useShowcaseData must be used inside ShowcaseProvider");
  }
  return ctx;
}
