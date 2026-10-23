import { createContext, useContext, type Dispatch, type SetStateAction } from "react";

export const CollectionSavedContext = createContext<{
  saved: string[];
  setSaved: Dispatch<SetStateAction<string[]>>;
} | null>(null);

/** Domain state shared by every navigation entry in one hero preview. */
export function useCollectionSaved() {
  const state = useContext(CollectionSavedContext);
  if (!state) throw new Error("CollectionBrowser requires CollectionSaveProvider");
  return state;
}
