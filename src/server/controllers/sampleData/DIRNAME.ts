import path from "node:path";
import { fileURLToPath } from "node:url";

export const DIRNAME = path.dirname(fileURLToPath(import.meta.url));
