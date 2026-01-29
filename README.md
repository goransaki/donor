# Donors RS

Апликација за управљање базом донора крви.

## Технологије

- Next.js 16
- React 19
- Tailwind CSS 4
- Supabase (Auth + Database)
- TypeScript

## Инсталација

```bash
npm install
```

## Конфигурација

Креирај `.env.local` фајл:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tvoj_anon_key
SUPABASE_SERVICE_ROLE_KEY=tvoj_service_role_key
```

## Покретање

```bash
npm run dev
```

Отвори [http://localhost:3000](http://localhost:3000)

## Build

```bash
npm run build
npm start
```
