# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## 🎁 Referral & Loyalty Program

This frontend includes UI components for the ConEco Referral Program:
- `src/pages/ReferralPage.jsx`: The main dashboard for customers and vendors to track their referrals.
- `src/components/ReferralCard.jsx`: A quick-view widget used on sidebars.
- `src/pages/AdminReferrals.jsx`: The admin control panel for tracking all signups, completions, and fulfilling tier prizes.

**Rules:** Referred users must verify their email AND complete a set number of orders (2 for Customers, 3 for Vendors) for the referrer to earn a point towards a milestone.
