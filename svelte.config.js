// Svelte 5 handles TypeScript natively, so no preprocessor is needed.
// This file exists so svelte-check does not fall back to vite.config.ts (Vite+ config without the Svelte plugin).
/** @type {import("svelte/compiler").CompileOptions & Record<string, unknown>} */
export default {};
