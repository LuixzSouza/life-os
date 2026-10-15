import { prisma } from "@/lib/prisma";
import { capFirst } from "@/lib/utils";
import { Prisma } from "@prisma/client";
import { TabsContent } from "@/components/ui/tabs";
import { AgendaTabsRoot } from "@/components/agenda/agenda-tabs";
import { isAgendaTab } from "@/components/agenda/agenda-shared";
import Link from "next/link";
import { CalendarClock, ListChecks } from "lucide-react";
import { ptBR } from "date-fns/locale";
import {
  parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameDay, format,
} from "date-fns";

import { AgendaHeader } from "@/components/agenda/agenda-header";
import { AgendaCalendar } from "@/components/agenda/agenda-calendar";
import { AgendaNav } from "@/components/agenda/agenda-nav";
import { UnifiedAgenda } from "@/components/agenda/unified-agenda";
import { TaskList } from "@/components/agenda/task-list";
import { RoutineManager } from "@/components/agenda/routine-manager";
import { TimeBlockingDay } from "@/components/agenda/time-blocking-day";
import { WeekPlanner } from "@/components/agenda/week-planner";
import { TodayPanel } from "@/components/agenda/today-panel";
import { getRoutineItems } from "./actions";
import { getThemedDays } from "./themed-days-actions";
import { getFocusStats, getFocusDrivers } from "./focus-actions";
import { FocusInsights } from "@/components/focus/focus-insights";
import { FocusDrivers } from "@/components/focus/focus-drivers";
import { getAgendaItems } from "@/lib/agenda-aggregator";
import { getCurrentUserId } from "@/lib/auth";

const projectSelect = { select: { title: true, color: true } } satisfies Prisma.ProjectArgs;

export const dynamic = "force-dynamic";

interface AgendaPageProps {
  searchParams: Promise<{ date?: string; tab?: string }>;
}

export default async function AgendaPage({ searchParams }: AgendaPageProps) {
  const params = await searchParams;
  const selectedDate = params.date ? parseISO(params.date) : new Date();
  const isSpecificDate = !!params.date;
  // Aba ativa vem da URL (deep-link + sobrevive ao refresh — D5 do roadmap).
  const activeTab = isAgendaTab(params.tab) ? params.tab : "calendar";
  const now = new Date();

  // Intervalo da grade do mês (6 semanas) — alimenta o calendário unificado.
  const rangeStart = startOfWeek(startOfMonth(selectedDate), { weekStartsOn: 0 });
  const rangeEnd = endOfWeek(endOfMonth(selectedDate), { weekStartsOn: 0 });

  const userId = await getCurrentUserId();

  // Semana do Planner (Método Alastrar): tarefas com vencimento na semana,
  // INCLUINDO as concluídas — riscar e continuar vendo é o ponto do método.
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });

  const [agendaItems, pendingTasks, pendingTaskCount, routineItems, blockEvents, themedDays, focusStats, focusDrivers, weekTasks, currentUser] = await Promise.all([
    getAgendaItems(rangeStart, rangeEnd),
    prisma.task.findMany({
      where: { isDone: false, userId, deletedAt: null },
      // nulls last: sem isso, 50 tarefas SEM prazo podiam esconder as datadas
      // (SQLite põe NULL primeiro) — e no Postgres a ordem inverteria.
      orderBy: { dueDate: { sort: "asc", nulls: "last" } },
      take: 50,
      include: { project: projectSelect },
    }),
    prisma.task.count({ where: { isDone: false, userId, deletedAt: null } }),
    getRoutineItems(),
    // Eventos da janela do mês para a grade de Time-Blocking (criar/editar reais).
    // Inclui a tarefa vinculada (isDone) p/ concluir direto do bloco. Âncoras
    // recorrentes ANTERIORES à janela também entram: são a porta de edição da
    // série (e do "só esta ocorrência") no calendário unificado.
    prisma.event.findMany({
      where: {
        userId, deletedAt: null,
        OR: [
          { startTime: { gte: rangeStart, lte: rangeEnd } },
          { frequency: { not: null }, startTime: { lte: rangeEnd } },
        ],
      },
      orderBy: { startTime: "asc" },
      include: { project: projectSelect, task: { select: { isDone: true, title: true } } },
    }),
    getThemedDays(),
    getFocusStats(),
    getFocusDrivers(),
    prisma.task.findMany({
      where: { userId, deletedAt: null, dueDate: { gte: weekStart, lte: weekEnd } },
      orderBy: { createdAt: "asc" },
      include: { project: projectSelect },
    }),
    // Saudação personalizada (G19): primeira palavra do nome do usuário.
    userId ? prisma.user.findUnique({ where: { id: userId }, select: { name: true } }) : Promise.resolve(null),
  ]);

  // Dias com registros + contagem (G21: o tracinho do mini-calendário vira intensidade).
  const busyCount = new Map<string, number>();
  for (const i of agendaItems) {
    const k = format(new Date(i.date), "yyyy-MM-dd");
    busyCount.set(k, (busyCount.get(k) ?? 0) + 1);
  }
  const busyDays = [...busyCount.entries()].map(([k, count]) => ({ date: new Date(`${k}T12:00:00`), count }));

  // Eventos serializados p/ editar/excluir direto no Calendário unificado.
  const editableEvents = blockEvents.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    startTime: e.startTime.toISOString(),
    endTime: e.endTime ? e.endTime.toISOString() : null,
    location: e.location,
    color: e.color,
    isAllDay: e.isAllDay,
    frequency: e.frequency,
    recurrenceEnd: e.recurrenceEnd ? e.recurrenceEnd.toISOString() : null,
    emailAlert: e.emailAlert,
  }));

  // Resumo do dia selecionado.
  const itemsToday = agendaItems.filter((i) => isSameDay(new Date(i.date), selectedDate));
  const nextUp = itemsToday
    .filter((i) => i.time && new Date(i.date) > now)
    .sort((a, b) => +new Date(a.date) - +new Date(b.date))[0];

  // Modo Hoje (#6): itens do dia REAL (independente do dia selecionado). Se o
  // usuário navega outro mês, hoje pode estar fora da janela carregada.
  const todayInRange = now >= rangeStart && now <= rangeEnd;
  const itemsRealToday = todayInRange ? agendaItems.filter((i) => isSameDay(new Date(i.date), now)) : [];
  const firstName = currentUser?.name?.trim().split(/\s+/)[0] || null;

  const summary = (
    <DaySummary
      date={selectedDate}
      itemsCount={itemsToday.length}
      pendingTaskCount={pendingTaskCount}
      nextUp={nextUp ? { title: nextUp.title, time: nextUp.time ?? "", subtitle: nextUp.subtitle ?? null } : null}
    />
  );

  return (
    <div className="min-h-screen bg-background pb-24 animate-in fade-in duration-500">
      <AgendaHeader isSpecificDate={isSpecificDate} date={selectedDate} userName={firstName} />

      {/* Layout de app de calendário: lateral fixa (navegação + mini-mês +
          resumo) e UM painel com a visão ativa — sem card dentro de card. */}
      <AgendaTabsRoot
        initialTab={activeTab}
        className="mx-auto flex max-w-[1600px] gap-6 px-4 py-5 md:px-6 lg:flex-row"
      >
        {/* Sem sticky: a lateral é mais alta que telas de 768px e o resumo ficava inalcançável. */}
        <aside className="hidden w-72 shrink-0 flex-col gap-6 self-start lg:flex">
          <AgendaNav variant="rail" counts={{ tasks: pendingTaskCount }} />
          <section aria-label="Mini calendário" className="rounded-xl border border-border/60 bg-card p-3">
            <AgendaCalendar busyDays={busyDays} />
          </section>
          {summary}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <AgendaNav variant="bar" className="lg:hidden" />

          <section className="flex min-h-[75vh] flex-col overflow-hidden rounded-xl border border-border/60 bg-card md:h-[calc(100vh-150px)] md:min-h-[640px]">
            {/* MODO HOJE (#6): linha do tempo vertical do dia real */}
            <TabsContent value="today" className="m-0 flex h-full flex-1 flex-col overflow-hidden p-0 data-[state=active]:flex">
              <TodayPanel items={itemsRealToday} inRange={todayInRange} />
            </TabsContent>

            {/* CALENDÁRIO UNIFICADO */}
            <TabsContent value="calendar" className="m-0 flex h-full flex-1 flex-col overflow-hidden p-0 data-[state=active]:flex">
              <UnifiedAgenda items={agendaItems} selectedDateISO={selectedDate.toISOString()} themedDays={themedDays} events={editableEvents} />
            </TabsContent>

            {/* TIME-BLOCKING (grade de horas interativa) */}
            <TabsContent value="blocks" className="m-0 flex h-full flex-1 flex-col overflow-hidden p-0 data-[state=active]:flex">
              <TimeBlockingDay events={blockEvents} tasks={pendingTasks} themedDays={themedDays} selectedDateISO={selectedDate.toISOString()} />
            </TabsContent>

            {/* PLANNER SEMANAL (Método Alastrar — dias × tarefas, riscar ao concluir) */}
            <TabsContent value="planner" className="m-0 flex h-full flex-1 flex-col overflow-hidden p-0 data-[state=active]:flex">
              <WeekPlanner tasks={weekTasks} selectedDateISO={selectedDate.toISOString()} themedDays={themedDays} />
            </TabsContent>

            {/* FOCO (painel de produtividade — últimos 7 dias + padrões) */}
            <TabsContent value="focus" className="m-0 flex-1 flex-col overflow-y-auto data-[state=active]:flex">
              <FocusInsights stats={focusStats} />
              <FocusDrivers drivers={focusDrivers} />
            </TabsContent>

            {/* TAREFAS */}
            <TabsContent value="tasks" className="m-0 flex-1 flex-col overflow-y-auto p-4 md:p-6 data-[state=active]:flex">
              <TaskList tasks={pendingTasks} total={pendingTaskCount} />
            </TabsContent>

            {/* ROTINA */}
            <TabsContent value="routine" className="m-0 flex-1 flex-col overflow-y-auto p-4 md:p-6 data-[state=active]:flex">
              <RoutineManager items={routineItems} />
            </TabsContent>
          </section>

          {/* Mobile: apoio DEPOIS do painel (as visões são o destino). */}
          <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
            <section aria-label="Mini calendário" className="flex justify-center rounded-xl border border-border/60 bg-card p-3">
              <AgendaCalendar busyDays={busyDays} />
            </section>
            {summary}
          </div>
        </div>
      </AgendaTabsRoot>
    </div>
  );
}

/** Resumo enxuto do dia selecionado: próximo compromisso + dois contadores. */
function DaySummary({
  date,
  itemsCount,
  pendingTaskCount,
  nextUp,
}: {
  date: Date;
  itemsCount: number;
  pendingTaskCount: number;
  nextUp: { title: string; time: string; subtitle: string | null } | null;
}) {
  return (
    <section aria-label="Resumo do dia" className="rounded-xl border border-border/60 bg-card p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">Resumo do dia</h2>
        <span className="text-xs text-muted-foreground">{capFirst(format(date, "EEE, d MMM", { locale: ptBR }))}</span>
      </div>

      {nextUp ? (
        // G1: o card LEVA a algum lugar — abre a grade de Blocos do dia.
        <Link
          href={`/agenda?date=${format(date, "yyyy-MM-dd")}&tab=blocks`}
          className="mb-3 flex items-start gap-3 rounded-lg border border-border/60 p-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
        >
          <span className="mt-0.5 rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-xs font-semibold tabular-nums text-primary">
            {nextUp.time}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{nextUp.title}</span>
            {nextUp.subtitle && <span className="block truncate text-xs text-muted-foreground">{nextUp.subtitle}</span>}
          </span>
        </Link>
      ) : (
        <p className="mb-3 rounded-lg bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
          Nada com horário pendente.
        </p>
      )}

      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          <dt className="sr-only">Registros no dia</dt>
          <dd className="font-semibold tabular-nums">{itemsCount}</dd>
          <span className="truncate text-xs text-muted-foreground">no dia</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
          <ListChecks className="h-4 w-4 text-muted-foreground" />
          <dt className="sr-only">Tarefas pendentes</dt>
          <dd className="font-semibold tabular-nums">{pendingTaskCount}</dd>
          <span className="truncate text-xs text-muted-foreground">tarefas</span>
        </div>
      </dl>
    </section>
  );
}
