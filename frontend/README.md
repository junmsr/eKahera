# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Local development with backend

By default the frontend will use a sensible API URL based on the environment:

- `VITE_API_BASE_URL` (if set in `.env`) — highest priority
- If running in Vite dev mode or served from `localhost` → `http://localhost:5000`
- Otherwise → `https://ekahera.onrender.com`

To run frontend + backend locally:

1. Start the backend:

```powershell
cd C:\Users\Darius\Desktop\Capstone\eKahera\backend
npm install
npm run dev
```

2. Start the frontend:

```powershell
cd C:\Users\Darius\Desktop\Capstone\eKahera\frontend
npm install
copy .env.example .env
npm run dev
```

To force the frontend to use the hosted backend instead, set `VITE_API_BASE_URL` in `.env`:

```
VITE_API_BASE_URL=https://ekahera.onrender.com
```

