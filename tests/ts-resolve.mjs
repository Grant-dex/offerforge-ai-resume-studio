// Tests run on raw .ts sources, where Node requires explicit extensions.
// Fall back to `<specifier>.ts` for relative imports so app modules can keep
// the extensionless style Vite expects.
import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (!specifier.startsWith(".") || specifier.endsWith(".ts")) throw error;
      return nextResolve(`${specifier}.ts`, context);
    }
  },
});
