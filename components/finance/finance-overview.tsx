"use client";

import { useState, useTransition, useMemo } from "react";
import { Wallet, AlertTriangle, DollarSign, Eye, EyeOff, FileSpreadsheet, Target } from "lucide-react";

import { Button } from "@/components/ui/button";

import { updateSalary } from "@/app/(dashboard)/finance/actions";
import { toast } from "sonner";
import { useFormatCurrency } from "@/components/providers/currency-provider";
import { useSmartView } from "@/components/finance/smart-view-context";

// report-generator carrega o ExcelJS (~1MB). Importado sob demanda (só ao
// exportar) para não pesar no bundle inicial da página de finanças.
import { FinanceOverviewProps } from "@/types/finance";

import { MetricCard, getHealthStatus, useIsClient, TOOLTIPS, type FinanceMetrics } from "./overview/overview-shared";
import { IncomeDynamicsCard } from "./overview/income-dynamics-card";
import { HealthDiagnosticCard } from "./overview/health-diagnostic-card";

export function FinanceOverview({
  totalBalance, netSalary, grossSalary, totalRecurring, totalPaidDebts = 0, totalPendingDebts = 0, wishlistTotal = 0, wishlistSaved = 0, transactions = [], recurringExpenses = []
}: FinanceOverviewProps) {
  const isClient = useIsClient();
  const formatMoney = useFormatCurrency();
  const { smartView, toggle: toggleSmartView } = useSmartView();
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [tempSalary, setTempSalary] = useState(grossSalary.toString());

  const metrics = useMemo<FinanceMetrics>(() => {
    const taxes = Math.max(0, grossSalary - netSalary);
    const residual = netSalary - totalRecurring - totalPaidDebts;
    const committedRaw = netSalary > 0 ? ((totalRecurring + totalPaidDebts) / netSalary) * 100 : 0;
    const committed = Math.min(committedRaw, 100);
    const health = getHealthStatus(committed, grossSalary > 0);
    return { taxes, residual, committed, health, hasSalary: grossSalary > 0 };
  }, [grossSalary, netSalary, totalRecurring, totalPaidDebts]);

  const handleSaveSalary = () => {
    const val = parseFloat(tempSalary.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (isNaN(val) || val < 0) return toast.error("Valor inválido");
    startTransition(async () => {
      try {
        await updateSalary(val);
        toast.success("Renda atualizada!");
        setIsEditing(false);
      } catch {
        toast.error("Erro ao atualizar salário");
      }
    });
  };

  const handleReport = async () => {
    toast.success("Gerando relatório...", { description: "Preparando seu arquivo Excel." });
    const { generateFinanceReport } = await import("./report-generator");
    generateFinanceReport({ totalBalance, netSalary, grossSalary, totalRecurring, totalPaidDebts, totalPendingDebts, metrics, transactions, recurringExpenses, wishlistTotal, wishlistSaved });
  };

  if (!isClient) return <div className="h-[400px] w-full bg-muted/10 animate-pulse rounded-2xl border border-border/40" />;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">

      {/* Barra de ferramentas da seção. O título da página já vem do
          PageHeader ("Financeiro") — antes havia um 2º cabeçalho ("Visão
          Global") com ícone e título grandes logo abaixo. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="eyebrow text-muted-foreground">Resumo</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReport} className="h-9 gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Relatório
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSmartView}
            aria-pressed={smartView}
            className="h-9 gap-2"
          >
            {smartView ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {smartView ? "Mostrar valores" : "Ocultar valores"}
          </Button>
        </div>
      </div>

      {/* CARDS DE MÉTRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard title="Patrimônio Consolidado" value={totalBalance} icon={<Wallet className="h-6 w-6 text-primary" />} variant="primary" tooltip={TOOLTIPS.patrimonio} isSmartView={smartView} />
        <MetricCard title="Dívida Ativa" value={totalPendingDebts} icon={<AlertTriangle className="h-6 w-6 text-rose-500" />} variant="danger" trend="up" tooltip={TOOLTIPS.dividaAtiva} isSmartView={smartView} />
        <MetricCard title="Cofre (Wishlist)" value={wishlistSaved} icon={<Target className="h-6 w-6 text-emerald-500" />} variant="default" description={`Meta Total: ${formatMoney(wishlistTotal)}`} tooltip={TOOLTIPS.metas} isSmartView={smartView} />
        <MetricCard title="Custos Fixos Totais" value={totalRecurring} icon={<DollarSign className="h-6 w-6 text-amber-500" />} variant="warning" tooltip={TOOLTIPS.custosFixos} isSmartView={smartView} />
      </div>

      {/* ÁREA DE DETALHES & SAÚDE FINANCEIRA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <IncomeDynamicsCard
          grossSalary={grossSalary}
          netSalary={netSalary}
          totalRecurring={totalRecurring}
          totalPaidDebts={totalPaidDebts}
          metrics={metrics}
          smartView={smartView}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          tempSalary={tempSalary}
          setTempSalary={setTempSalary}
          onSaveSalary={handleSaveSalary}
          isPending={isPending}
        />
        <HealthDiagnosticCard metrics={metrics} smartView={smartView} isClient={isClient} />
      </div>
    </div>
  );
}
