# Sale CRM - Frontend (`salecrmfe`)

The Sale CRM product's Vite + React + TypeScript SPA. Follows the conventions of the sibling `maxpmfe`
and `userpmfe` ("shell") apps in this workspace:

- **Login happens in the shell app** (`userpmfe`, port 5173), not here. This app only checks whether the
  shared `accessToken` cookie still resolves to a user (`ProtectedRoute` calls the User Service's `/users/me`)
  and redirects to the shell's login page if not.
- Every request to `salecrmbd` carries a `productID` header, the same way `maxpmfe` sends `productID: '1'`
  for Max PM (see `src/app/api.ts` / `src/app/constants.ts`). "Sales CRM" is **already seeded as product id
  `2`** in `userbd` and hardcoded as `id: 2` in the shell's `ProductSelectionPage` - confirm that against
  the live DB before shipping, see `../INTEGRATION.md`.
- State: Redux Toolkit + RTK Query + `redux-persist`, same as the sibling apps.
- Runs on port **5175** (shell=5173, Max PM=5174) - this is already the exact port `userpmfe`'s
  `VITE_PRODUCT_CRM_URL` points at in dev, so the shell's "Launch" button already works.

## What's here

- Routing, protected-route guard, main layout (sidebar + header)
- Auth slice + a `getMe` query against the User Service
- A fully working **Leads** page (`/leads`) - list, create, delete - wired to `salecrmbd`'s `/api/leads`
- `.env.development` / `.env.staging` / `.env.production`, `Dockerfile`, `docker-compose.yml`

## Adding the next module (Deals, Tasks, Meetings, Incentive, Tickets, Reports, Dashboard)

Copy the `leads` module's shape as a template:

1. `src/modules/<name>/models/index.ts` - TypeScript types matching the backend's response shape
2. `src/modules/<name>/services/index.ts` - an RTK Query `createApi` slice (see `leads/services`)
3. `src/modules/<name>/pages/<Name>ListPage.tsx` - the page component
4. Register the reducer/middleware in `src/store/store.ts`
5. Add the route in `src/routes/index.tsx` and a sidebar entry in `src/layouts/main-layout`

## Running locally

```bash
npm install
npm run dev
```

Requires `salecrmbd` running on port 3003 and `userbd` running on port 3001 (for the `/users/me` check),
with the shell app's login flow already having set the shared cookie.

See `../INTEGRATION.md` for the small handful of things still needed on the platform side - most of the
integration (product registration, auth, webhooks) is already wired up, not just stubbed.
