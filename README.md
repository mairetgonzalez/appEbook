# Diagramador de Ebook

PWA para criação, diagramação e exportação de ebooks profissionais em PDF e ePub.

## Stack
- React 19 + TypeScript + Vite
- TanStack Router (estrutura de rotas estilo Start)
- Tailwind CSS v4
- shadcn/ui (componentes base)
- Lovable Cloud (Supabase compatível)
- jsPDF + JSZip
- Sonner

## Rodar localmente
```bash
npm install
npm run dev
```

Configure `.env` com base em `.env.example`.

## Banco de dados
A migration SQL está em `supabase/migrations/202604230001_create_ebook_projects.sql`.
