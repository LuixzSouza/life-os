// Conteudo autenticado por-usuario: render por requisicao (nunca prerender no build).
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma"
import { Link2 } from "lucide-react"
import { LinkGrid } from "@/components/links/link-grid"
import { getCurrentUserId } from "@/lib/auth"
import { PageShell, PageHeader, PageContainer } from "@/components/layout/page-shell"
import { AskAiButton } from "@/components/ai/ask-ai-button"

export default async function LinksPage() {
  const userId = await getCurrentUserId()
  const links = await prisma.savedLink.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  })

  const categoryCount = new Set(links.map((l) => l.category || "Geral")).size

  return (
    <PageShell>
      <PageHeader
        icon={<Link2 className="h-6 w-6" />}
        title="Biblioteca de links"
        // Contagem no subtítulo (padrão de Projetos), não em caixas no cabeçalho.
        description={`${links.length} ${links.length === 1 ? "link" : "links"} · ${categoryCount} ${categoryCount === 1 ? "categoria" : "categorias"}`}
        actions={
          <AskAiButton q="Organize minha biblioteca de links: o que está sem categoria ou parece duplicado?" label="Organizar com IA" />
        }
      />

      <PageContainer className="space-y-10">
        <LinkGrid links={links} />
      </PageContainer>
    </PageShell>
  )
}

