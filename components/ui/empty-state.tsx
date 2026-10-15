import * as React from "react"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Estado vazio PADRÃO do sistema. Use sempre que uma lista/seção não tiver
 * itens — não monte "Nenhum X encontrado" com tracejado à mão.
 * - size="md" (padrão): seção/página inteira vazia.
 * - size="sm": dentro de um card/painel (mais compacto).
 * - bordered={false}: quando o contêiner pai já tem moldura.
 */
interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
  size?: "sm" | "md"
  bordered?: boolean
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  size = "md",
  bordered = true,
  className,
}: EmptyStateProps) {
  const sm = size === "sm"
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        sm ? "gap-2 px-4 py-8" : "gap-3 px-6 py-12",
        bordered && "rounded-2xl border border-dashed border-border/60 bg-muted/10",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-xl bg-muted/50 text-muted-foreground",
          sm ? "mb-1 size-10" : "mb-2 size-12"
        )}
      >
        <Icon className={sm ? "size-5" : "size-6"} />
      </div>
      <h3 className={cn("font-semibold text-foreground", sm ? "text-sm" : "text-base")}>{title}</h3>
      {description && (
        <p className={cn("max-w-sm text-muted-foreground leading-relaxed", sm ? "text-xs" : "text-sm")}>
          {description}
        </p>
      )}
      {action && <div className={cn("flex items-center justify-center", sm ? "mt-2" : "mt-4")}>{action}</div>}
    </div>
  )
}
