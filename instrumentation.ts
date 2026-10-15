// Executado pelo Next.js uma vez quando o servidor sobe.
// Só no runtime Node (o proxy/edge não tem banco nem timers longos).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production") return; // dev: HMR reiniciaria timers à toa
  const { startBackgroundJobs } = await import("./lib/background-jobs");
  startBackgroundJobs();
}
