/* eslint-disable @typescript-eslint/naming-convention */
// Rule stated: Type Parameter name `S` must match the RegExp: /^(T|T[A-Z][A-Za-z]+)$/u

import type { StoreApi, UseBoundStore } from "zustand";

// LINK - Reference: https://zustand.docs.pmnd.rs/guides/auto-generating-selectors

type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never;

export const createBoundSelectors = <S extends UseBoundStore<StoreApi<object>>>(
  _store: S,
) => {
  const store = _store as WithSelectors<typeof _store>;
  store.use = {};
  for (const k of Object.keys(store.getState())) {
    (store.use as any)[k] = () => store((s) => s[k as keyof typeof s]);
  }

  return store;
};

// Below function will likely be unused as we won't be using vanilla zustand stores
// export const createVanillaSelectors = <S extends StoreApi<object>>(
//   _store: S,
// ) => {
//   const store = _store as WithSelectors<typeof _store>;
//   store.use = {};
//   for (const k of Object.keys(store.getState())) {
//     (store.use as any)[k] = () =>
//       useStore(_store, (s) => s[k as keyof typeof s]);
//   }

//   return store;
// };
