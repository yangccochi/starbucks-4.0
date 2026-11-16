# STARBUCKS 4.0 — Public Demo Dashboard (No Login)

This version removes manager login entirely. Anyone with the deployed admin URL can read order and inventory information and can start or complete any order, causing real changes to the shared Supabase demo database. **Use a dedicated demonstration project only; never connect it to real payments, actual equipment or sensitive customer information.**

## Install
1. Extract this zip into a new folder and open the inner `starbucks-step5-public` folder in VS Code.
2. Copy your previous `.env.local` into it, preserving `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `SESSION_SECRET`. You do not need `ADMIN_PASSWORD`.
3. Run `npm install` then `npm run dev`. Use the `Local:` URL shown in the terminal (port may be 3000 or 3001).
4. Open `http://localhost:3000/admin.html` (adjust the port to match the terminal), or `/customer.html`.

## Behavior
- GET `/api/admin/state`: publicly reads recent orders and inventory.
- POST `/api/admin/start`: public action, changes `checking` to `making`, deducts recipe ingredients once in Supabase.
- POST `/api/admin/complete`: public action, changes `making` to `completed`.
- No administrator login endpoints or page.
- The existing SQL rules are unchanged, including only one active order at a time, and the three-product menu.

## Public deployment warning
This is intentionally **unauthenticated**, which means strangers can modify your demo orders/inventory by visiting the website or calling the public same-origin application. Same-origin checks are not access controls against someone using the site. For public deployment, use a throwaway/sandbox Supabase project, avoid real customer details and external payment/robot integrations, add API rate limits, activity logging, and a demo reset facility. The secret Supabase key must still be stored **server-side only** in Vercel environment variables.
