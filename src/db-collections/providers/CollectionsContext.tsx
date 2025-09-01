import { createContext } from "react";
import type { CollectionsContextType } from "./CollectionProvider";

export const CollectionsContext = createContext<
  CollectionsContextType | undefined
>(undefined);
