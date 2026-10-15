import { prisma } from "@/lib/prisma";

const INBOX_NAME = "Entrada";

/**
 * Garante que o usuário tenha um caderno Inbox; devolve o id dele.
 *
 * Fica em `lib/` (e não num arquivo "use server") de propósito: recebe o
 * `userId` como parâmetro, então NÃO pode ser uma Server Action exportada —
 * qualquer cliente poderia chamá-la escolhendo o usuário. Só deve ser chamada
 * por código de servidor que já resolveu o `userId` da sessão.
 */
export async function ensureInbox(userId: string): Promise<string> {
  const existing = await prisma.notebook.findFirst({
    where: { userId, isInbox: true },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await prisma.notebook.create({
    data: { userId, name: INBOX_NAME, isInbox: true, color: "#64748b", icon: "inbox", position: -1 },
  });
  return created.id;
}
