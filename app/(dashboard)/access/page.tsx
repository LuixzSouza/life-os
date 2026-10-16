// Conteudo autenticado por-usuario: render por requisicao (nunca prerender no build).
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma"
import { LockKeyhole, ShieldAlert, Repeat2, Activity } from "lucide-react"
import { AccessView } from "@/components/access/access-view"
import { getCurrentUserId } from "@/lib/auth"
import { getVaultSecurityAudit } from "./actions"
import { Metadata } from "next"
import { PageShell, PageHeader, PageContainer } from "@/components/layout/page-shell"
import { StatCard } from "@/components/ui/stat-card"

export const metadata: Metadata = {
  title: "Cofre de Senhas | Life OS",
}

export default async function AccessPage() {
  // 1. Data Fetching
  // REMOVI O 'select'. Agora ele busca tudo (incluindo notes, userId, createdAt)
  // para satisfazer a tipagem do AccessItem e permitir a busca por notas.
  const userId = await getCurrentUserId()
  // Itens do cofre + auditoria de segurança são independentes — paralelos.
  const [allItems, audit] = await Promise.all([
    prisma.accessItem.findMany({
      where: { userId },
      orderBy: { title: "asc" },
    }),
    getVaultSecurityAudit(),
  ])
  const { stats } = audit
  const healthColor =
    stats.healthScore >= 75 ? "text-emerald-500"
    : stats.healthScore >= 45 ? "text-amber-500"
    : "text-rose-500"

  return (
    <PageShell>
      <PageHeader
        icon={<LockKeyhole className="h-6 w-6" />}
        title="Cofre de acessos"
        description="Credenciais pessoais e corporativas num lugar só — criptografadas no seu dispositivo."
      />

      <PageContainer className="space-y-8">
        {/* Indicadores do cofre: linha de StatCards (padrão das demais telas),
            não mais caixas dentro do cabeçalho. */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Saúde do cofre"
            value={<span className={healthColor}>{stats.healthScore}%</span>}
            icon={Activity}
            hint={stats.healthScore >= 75 ? "Senhas em bom estado" : "Há senhas para revisar"}
          />
          <StatCard label="Itens" value={allItems.length} icon={LockKeyhole} hint="Credenciais e anotações" />
          <StatCard
            label="Senhas frágeis"
            value={stats.weak}
            icon={ShieldAlert}
            hint={stats.weak > 0 ? "Troque por senhas fortes" : "Nenhuma senha fraca"}
            iconClassName={stats.weak > 0 ? "text-rose-500 bg-rose-500/10" : undefined}
          />
          <StatCard
            label="Senhas repetidas"
            value={stats.reused}
            icon={Repeat2}
            hint={stats.reused > 0 ? "Use uma senha por serviço" : "Nenhuma repetida"}
            iconClassName={stats.reused > 0 ? "text-amber-500 bg-amber-500/10" : undefined}
          />
        </section>
        <AccessView initialItems={allItems} audit={audit} />
      </PageContainer>
    </PageShell>
  )
}