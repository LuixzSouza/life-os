import { Metadata } from "next";
import { getMarketOverview } from "@/lib/market-service";
import { getWatchlist } from "@/app/(dashboard)/finance/actions";
import { getBrapiToken } from "@/lib/brapi-token";
import { MARKET_POOL, pickRandom } from "@/lib/market-pool";
import { requireUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { MarketDashboard } from "@/components/finance/market/market-dashboard"; // Vamos criar esse componente
import { LineChart } from "lucide-react";
import { PageShell, PageHeader, PageContainer } from "@/components/layout/page-shell";

export const metadata: Metadata = {
  title: "Mercado Financeiro | LifeOS",
  description: "Cotações em tempo real da B3, Câmbio e Criptomoedas.",
};

export default async function MarketPage() {
  // Vamos buscar uma lista mais completa de ativos para essa página dedicada
  // Seleção aleatória do universo da B3 — "descoberta" para quem não conhece tickers.
  // O usuário pode favoritar/buscar outras no cliente; "Descobrir outras" re-sorteia.
  const extendedTickers = pickRandom(MARKET_POOL, 18);

  const userId = await requireUserId();
  const brapiToken = await getBrapiToken(userId);
  const [marketData, watchlist] = await Promise.all([
    getMarketOverview(extendedTickers, brapiToken),
    getWatchlist(),
  ]);

  return (
    <PageShell>
      <PageHeader
        backHref="/finance"
        backLabel="Voltar para Finanças"
        icon={<LineChart className="h-6 w-6" />}
        title="Terminal de mercado"
        description="Cotações da B3, FIIs, ETFs, câmbio e cripto em tempo real."
      />

      <PageContainer>
        <MarketDashboard data={marketData} initialFavorites={watchlist} />
      </PageContainer>
    </PageShell>
  );
}