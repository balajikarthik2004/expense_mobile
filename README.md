# KB_Expense — mobile

Expo / React Native client for the KB_Expense ledger, built from the Google Stitch
design set in [`../design/`](../design/).

## Running it

```bash
npm install
cp .env.example .env     # then set your machine's LAN IP
npm start
```

The backend must be running (`../expense_backend`, default port 5000). On a physical
device `localhost` points at the phone, so `EXPO_PUBLIC_API_BASE_URL` has to be your
computer's LAN IP — an emulator can use `10.0.2.2` (Android) or `localhost` (iOS sim).

## Stack

| Concern | Choice |
|---|---|
| SDK | Expo 57 (React Native 0.86, React 19.2.3) |
| Routing | `expo-router` (file-based, in `app/`) |
| Fonts | Playfair Display / DM Sans / JetBrains Mono via `@expo-google-fonts` |
| Token storage | `expo-secure-store` |
| Gestures / animation | `react-native-gesture-handler`, `react-native-reanimated` 4 |
| Icons | `MaterialCommunityIcons` from `@expo/vector-icons` |
| Charts | not yet added — `react-native-svg` is installed as the base |

`react-dom` is pinned to `19.2.3` via `overrides` in `package.json`. Without it, npm
fails to install: `expo-router` pulls `react-dom@19.3.0` transitively, which demands
`react@^19.3.0`, but SDK 57 pins `react@19.2.3`. Remove the override only when Expo
moves to React 19.3.

## Layout

```
app/
  _layout.jsx          root: fonts, providers, auth gate
  sign-in.jsx          combined sign in / sign up
  add-expense.jsx      modal sheet  (stub)
  add-income.jsx       modal sheet  (stub)
  (tabs)/
    _layout.jsx        custom tab bar + rust FAB
    index.jsx          Dashboard    (stub)
    income.jsx         Income       (stub)
    analytics.jsx      Analytics    (stub)
    settings.jsx       Settings     (partial)
src/
  theme/tokens.js      design tokens, verbatim from Stitch
  theme/index.js       semantic aliases + layout constants
  api/client.js        REST client with token refresh
  lib/auth.jsx         auth context
  lib/categories.js    category definitions (ids match the backend enums)
  lib/format.js        currency, dates, grouping
  components/          Screen, AppHeader, Emblem, SegmentedControl, Placeholder
```

## State

**Done:** project setup, fonts, theme, navigation shell (blurred header, tab bar, FAB),
API client with single-flight token refresh, auth context and gate, sign-in screen.

**Stubbed:** all four tab screens and both entry sheets render inside the real shell but
list their sections rather than implementing them.

## Notes carried over from the design review

- The Stitch palette is used as designed, and differs from the web app's. See
  [`../design/STITCH_DESIGN.md`](../design/STITCH_DESIGN.md) for the drift table.
- Features Stitch invented that the API does not support (ledger tags, receipt
  attachments, merchant field, income status labels, scheduled horizon) are to be built
  as presentation only for now.
- The emblem is rebuilt in code (`src/components/Emblem.jsx`) because the design
  referenced a `googleusercontent.com` URL that will expire. The avatar in the design is
  placeholder stock and is currently an icon fallback.
- Unlike the web client, this app should use the server's `/analytics/*` and `/summary`
  endpoints rather than downloading every record and computing locally.
