// import { create } from "zustand";
// import { createBoundSelectors } from "./createSelectors";
// import type { CustomSnackbarProps } from "@/components/Snackbar";

// interface SnackbarActions {
//   setSnackbar: (
//     open: boolean,
//     message: string,
//     autoHideDuration: number | null,
//   ) => void;
// }

// const useSnackbarStoreBase = create<CustomSnackbarProps & SnackbarActions>()(
//   (set) => ({
//     open: false,
//     message: "",
//     autoHideDuration: null,
//     setSnackbar: (open, message, autoHideDuration) =>
//       set(() => ({ open, message, autoHideDuration })),
//   }),
// );

// export const useSnackbarStore = createBoundSelectors(useSnackbarStoreBase);
