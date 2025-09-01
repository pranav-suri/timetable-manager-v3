import { useContext } from "react";
import { CollectionsContext } from "./CollectionsContext";

export function useCollections() {
  const ctx = useContext(CollectionsContext);
  if (!ctx)
    throw new Error("useCollections must be used within a CollectionsProvider");
  return ctx;
}
