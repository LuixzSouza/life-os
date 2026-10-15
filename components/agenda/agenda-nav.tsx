"use client";

// Navegação entre as visões da Agenda. Duas apresentações do MESMO Tabs root
// (AgendaTabsRoot): lista vertical na lateral (desktop) e barra rolável no topo
// (mobile). Usa o Radix direto — o TabsTrigger base tem estilo de "pílula"
// (borda/brilho) que não combina com uma navegação de app.

import * as TabsPrimitive from "@radix-ui/react-tabs";
import {
  Brain, CalendarRange, ListTodo, PenLine, Sun, Sunrise, Timer, type LucideIcon,
} from "lucide-react";
import type { AgendaTab } from "./agenda-shared";
import { cn } from "@/lib/utils";

const ITEMS: { value: AgendaTab; label: string; hint: string; icon: LucideIcon }[] = [
  { value: "today", label: "Hoje", hint: "Linha do tempo do dia", icon: Sunrise },
  { value: "calendar", label: "Calendário", hint: "Mês, semana e dia", icon: CalendarRange },
  { value: "blocks", label: "Blocos", hint: "Grade de horários", icon: Timer },
  { value: "planner", label: "Planner", hint: "Semana × tarefas", icon: PenLine },
  { value: "tasks", label: "Tarefas", hint: "Pendências", icon: ListTodo },
  { value: "routine", label: "Rotina", hint: "Hábitos recorrentes", icon: Sun },
  { value: "focus", label: "Foco", hint: "Produtividade", icon: Brain },
];

interface AgendaNavProps {
  variant: "rail" | "bar";
  /** Contador opcional ao lado do rótulo (ex.: tarefas pendentes). */
  counts?: Partial<Record<AgendaTab, number>>;
  className?: string;
}

export function AgendaNav({ variant, counts, className }: AgendaNavProps) {
  if (variant === "bar") {
    return (
      <TabsPrimitive.List
        aria-label="Visões da agenda"
        className={cn(
          "-mx-4 flex gap-1 overflow-x-auto scrollbar-hide border-b border-border/60 px-4",
          className,
        )}
      >
        {ITEMS.map(({ value, label, icon: Icon }) => (
          <TabsPrimitive.Trigger
            key={value}
            value={value}
            className={cn(
              "relative flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors",
              "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-t-md",
              "data-[state=active]:text-foreground",
              "after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-transparent data-[state=active]:after:bg-primary",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
    );
  }

  return (
    <TabsPrimitive.List aria-label="Visões da agenda" className={cn("flex flex-col gap-0.5", className)}>
      {ITEMS.map(({ value, label, hint, icon: Icon }) => {
        const count = counts?.[value];
        return (
          <TabsPrimitive.Trigger
            key={value}
            value={value}
            title={hint}
            className={cn(
              "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-muted-foreground transition-colors",
              "hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              "data-[state=active]:bg-primary/10 data-[state=active]:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0 transition-colors group-data-[state=active]:text-primary" />
            <span className="flex-1 truncate">{label}</span>
            {count != null && count > 0 && (
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground group-data-[state=active]:bg-primary/15 group-data-[state=active]:text-primary">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </TabsPrimitive.Trigger>
        );
      })}
    </TabsPrimitive.List>
  );
}
