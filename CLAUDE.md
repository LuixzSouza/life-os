# Life OS - AI Developer Guidelines

## 🎯 Project Overview
Life OS is a privacy-first, local-capable "Second Brain" operating system. It unifies Finances, Projects, Studies, Social CRM, Wardrobe, and Hybrid AI into a single platform.
**Core Philosophy:** 
1. **Privacy & Local-First:** No mandatory cloud. Data lives in a portable SQLite file that the user controls and can move via the UI.
2. **Frictionless UX:** Zero barriers to entry. Everything must be fast, beautiful, and require minimal user effort.
3. **Premium SaaS Design:** Clean interfaces, accessible components, and highly performant architecture.

## 🛠 Tech Stack
- **Framework:** Next.js 15 (App Router & Server Actions)
- **Language:** TypeScript (Strict Mode)
- **Database:** SQLite + Prisma ORM
- **Auth:** `jose` (Stateless JWT with encrypted cookies)
- **Styling:** Tailwind CSS + Shadcn UI (Radix Primitives) + `cn()` utility
- **Animations & Charts:** Framer Motion + Recharts
- **Icons & Alerts:** Lucide React + Sonner
- **AI Engine:** Hybrid (Local via Ollama + Cloud via OpenAI/Groq/Gemini)

---

## 🛑 STRICT AI DIRECTIVES (READ BEFORE CODING)

### 1. Verification & Build Safety (Mandatory)
- **Rule:** Never suggest code that introduces TypeScript errors. DO NOT USE `any`. Define strict interfaces/types.
- **Rule:** If you add or modify a Prisma Model, you MUST remind the user to run `npx prisma generate` and `npx prisma db push` or `npx prisma migrate dev`.
- **Rule:** Vercel Build Compatibility: Always ensure the build script triggers `prisma generate && prisma db push` if testing cloud deployments, as Vercel caches outdated Prisma clients and lacks a persistent filesystem.

### 2. Architecture & Server Actions
- **Mutations:** All database mutations MUST be done via Server Actions with `"use server"` at the top.
- **Security:** EVERY Server Action MUST fetch the authenticated `userId` (via JWT) and use it in the `where` clause (e.g., `where: { id: itemId, userId: userId }`).
- **Prisma Updates/Deletes:** Always use `updateMany` and `deleteMany` when combining `id` and `userId` in the `where` clause to avoid Prisma composite key errors on non-unique fields.
- **Dates & Timezones:** When saving dates from HTML `<input type="date">`, always append `T12:00:00Z` before parsing with `new Date()` to prevent timezone shifts (the "previous day" bug).

### 3. Database & Portability (SQLite)
- Understand that the SQLite database file path (`DATABASE_URL`) can be changed dynamically by the user via the UI. Ensure any DB path operations respect `.env` dynamic configurations.
- Use **Base64 encoding** or local paths for image uploads (like Profile avatars and Wardrobe items) to keep the app portable without relying on AWS S3 or external buckets unless explicitly configured.

### 4. Frontend & Performance (React)
- **Modals in Lists:** NEVER put `<Dialog>` or `<AlertDialog>` inside a `.map()` loop. Use a single global modal controlled by state (e.g., `const [selectedItem, setSelectedItem] = useState(null)`).
- **Event Bubbling:** If placing buttons/dropdowns inside a clickable Card, ALWAYS use `e.stopPropagation()` on the inner buttons to prevent firing the Card's `onClick`.
- **Image Fallbacks (Frictionless UX):** Users shouldn't be forced to upload photos. Always provide a beautiful visual fallback using CSS background colors (`hex`), dynamic initials, or category icons with `mix-blend-overlay`.

### 5. Design System (Premium SaaS)
- **Headers:** Use `sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/40` for main layout headers.
- **Cards:** Use subtle styling. Avoid heavy gradients or deep shadows. Use `bg-card border-border/40 shadow-sm hover:shadow-md hover:border-primary/30 transition-all`.
- **Badges:** Use soft background colors with strong text (e.g., `bg-primary/10 text-primary border-none`).
- **Responsiveness:** Always ensure toolbars and tabs scroll horizontally (`overflow-x-auto scrollbar-hide`) on mobile. Ensure main layouts use `max-w-7xl mx-auto`.

### 6. Padrões visuais do sistema (padronização de 2026-10)
Toda tela segue estes padrões — não reinvente localmente:
- **Estrutura de página:** `PageShell` + `PageHeader` (ícone, título, descrição, `actions`) + `PageContainer` (`components/layout/page-shell.tsx`). Um cabeçalho só por tela — nada de 2º título grande logo abaixo.
- **Ações do cabeçalho:** só AÇÕES da tela atual (contextuais). Atalhos de navegação que já estão no menu lateral não entram no header.
- **Rótulo pequeno em caixa-alta** (títulos de card/KPI/seção, rótulos de campo): use **só** `eyebrow` + uma cor (`eyebrow text-muted-foreground`). Proibido montar `text-[10px] font-black uppercase tracking-widest` à mão. O `cn()` já entende que `eyebrow` substitui tamanho/peso/espaçamento.
- **Texto dinâmico em caixa-alta:** se o rótulo mostra algo que vem em minúsculas (mês/dia da semana do `date-fns`, "agora", tempo relativo), a caixa-alta vem do `eyebrow` — nunca remova o `uppercase` de um rótulo assim sem tratar o texto.
- **Botões:** nunca em caixa-alta e nunca com `eyebrow`. O `<Button>` base já define o raio (`rounded-lg`); não sobrescreva `rounded-*` (exceto `rounded-full` para botão redondo). Tamanhos: `size="sm"` (h-8), padrão (h-9), `size="lg"` (h-10).
- **Campos (Input/Select/Textarea), Card e Dialog:** o visual vem do componente base (`components/ui/*`). Não sobrescreva altura, `rounded-*`, fundo, cor de borda nem sombra — só layout/largura, ícones e tipografia. Exceções intencionais: campos compactos (`h-8`/`h-9`) e campos "sem moldura" (`bg-transparent border-0`).
- **Estado vazio:** sempre `EmptyState` (`components/ui/empty-state.tsx`; `size="sm"` dentro de cards). Não monte "Nenhum X" com tracejado à mão.
- **Tipografia:** sem `font-black`+`uppercase` em texto corrido; títulos `font-semibold`, textos `font-medium`/normal; mínimo `text-xs` (exceto `eyebrow`, 11px).
- **Datas pt-BR:** `capFirst(format(...))` (`lib/utils`). Nunca o CSS `capitalize` (gera "Quinta-Feira, 15 De Outubro").
- **Arredondamento:** containers `rounded-2xl`/`rounded-xl`, internos `rounded-lg`, chips `rounded-md`. Sem `rounded-[2rem]` & cia.
- **Cores em JS/SVG/Recharts:** `var(--primary)` ou `color-mix(in oklch, var(--x) 40%, transparent)`. O tema é **oklch**: `hsl(var(--x))` é cor INVÁLIDA (gráfico sem cor).
- **Gráficos:** `ChartContainer` (`components/ui/chart-container.tsx`), nunca `ResponsiveContainer` cru.
- **Imagens externas:** `SafeImg` (`components/ui/safe-img.tsx`) com `fallback` — link quebrado nunca mostra ícone de imagem quebrada.
- **Cards de ação ("+ Registrar…"):** sutis (`border-dashed`, destaque só no ícone), não blocos sólidos de cor primária.
- **Textos da interface em português** (nada de "Overview", "Smart View", "Sleep Score").

### 7. Armadilhas de Server Actions (aprendidas na prática)
- Arquivo `"use server"` **só exporta funções async** — exportar const/objeto derruba o módulo (HTTP 500). Constantes compartilhadas vão em `lib/`.
- Toda Server Action exportada é um **endpoint público** (chamável de qualquer rota; o `proxy.ts` não protege). Sempre checar a sessão nela ou na `lib` que ela chama, e **nunca** receber `userId` como parâmetro.

---

## 💻 Useful Commands

- **Run Dev:** `npm run dev`
- **Lint Check:** `npm run lint`
- **Build:** `npm run build` *(Runs prisma generate & db push)*
- **Prisma Studio:** `npx prisma studio`
- **Prisma Migrations (Local):** `npx prisma migrate dev`

**End of Instructions.** Always prioritize elegant, privacy-respecting, and frictionless code.

VOCê TEM LIBERDADE PARA SER CRIATIVO NESSE SISTEMA APENAS TOMANDO CUIDADO PARA NÃO QUEBRAR PEDE TRAZER FUNCIONALIDADES NOVAS OU OQUE PREFERIR SENDO CRIATIVO UM SISTEMA BEM TIPADO SEM USO DE ANY SEMPRE VALIDANDO O LINT