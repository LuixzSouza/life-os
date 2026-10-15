// ============================================================================
// AGENDADOR DO SERVIDOR — lembretes, backup diário, integridade e IA agendada
// rodando com o app FECHADO.
// ============================================================================
// Antes, tudo isso pegava carona no sino de notificações: só rodava com uma aba
// aberta e logada. Quem passava dias sem abrir o Life OS ficava sem backup
// (houve um buraco de 6 semanas). No desktop o servidor fica de pé desde o boot
// (atalho na Inicialização), então ele mesmo dispara o motor de tempos em tempos.
//
// Seguro rodar junto com o sino: o motor é idempotente por dia (notifyOnce,
// runAutoBackupIfDue, runIntegrityCheckIfDue, claim atômico das automações).
// Em serverless (Vercel) não roda: não há processo longo.

import { prisma } from "@/lib/prisma";
import { isEphemeralServerless, isSystemInstalled } from "@/lib/db-config";
import { generateRemindersForUser } from "@/lib/notifications";

/** 1ª rodada logo após o boot (deixa o servidor e a réplica assentarem). */
const FIRST_RUN_DELAY_MS = 2 * 60 * 1000;
/** Depois, de hora em hora — o motor decide sozinho o que está "devido". */
const INTERVAL_MS = 60 * 60 * 1000;

declare global {
  var __lifeOsJobs: { started: boolean; running: boolean; lastRunAt: number | null } | undefined;
}

const jobs = (globalThis.__lifeOsJobs ??= { started: false, running: false, lastRunAt: null });

async function runOnce(): Promise<void> {
  if (jobs.running || !isSystemInstalled()) return;
  jobs.running = true;
  const t0 = Date.now();
  try {
    const users = await prisma.user.findMany({ select: { id: true } });
    let created = 0;
    for (const { id } of users) {
      try {
        created += await generateRemindersForUser(id, { heavy: true });
      } catch (e) {
        // Um usuário com problema não pode travar os outros.
        console.error(`[jobs] falha nos lembretes de ${id.slice(0, 8)}:`, e);
      }
    }
    jobs.lastRunAt = Date.now();
    console.log(`⏰ [jobs] rodada ok: ${users.length} usuário(s), ${created} aviso(s) novo(s), ${Date.now() - t0}ms`);
  } catch (e) {
    console.error("[jobs] rodada falhou:", e);
  } finally {
    jobs.running = false;
  }
}

/** Inicia o agendador uma única vez por processo. */
export function startBackgroundJobs(): void {
  if (jobs.started || isEphemeralServerless()) return;
  if (process.env.LIFE_OS_DISABLE_JOBS === "1") return;
  jobs.started = true;

  const first = setTimeout(() => void runOnce(), FIRST_RUN_DELAY_MS);
  const every = setInterval(() => void runOnce(), INTERVAL_MS);
  // Não segura o processo vivo só por causa dos timers.
  first.unref();
  every.unref();
  console.log("⏰ [jobs] agendador iniciado (1ª rodada em 2 min, depois a cada 1h)");
}
