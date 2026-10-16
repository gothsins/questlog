# React + TypeScript + Vite

## Landing product tour

The public `/` route contains a local, illustrative product tour. Its script and
control state live in `src/components/tourScript.ts`; the UI is in
`ProductTour.tsx` and `product-tour.css`. The sample game and status changes are
frontend constants and state only. The tour does not call the API, access a
session, or persist data. It pauses outside the viewport, when the tab is
hidden, or when the visitor presses Pause, and stops after the final scene.
With reduced motion, each scene is a static snapshot and the next-scene control
advances manually.

Run `npm ci`, `npm run build`, `npm run lint`, and `npm test` from this directory.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
