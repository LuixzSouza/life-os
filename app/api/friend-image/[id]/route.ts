// Conteudo autenticado por-usuario: render por requisicao (nunca prerender no build).
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { parseBase64DataUrl } from "@/lib/friend-image";
import { NextResponse } from "next/server";

// Serve a foto de um amigo (data URL base64 em Friend.imageUrl). Protegida: só
// o dono acessa (mesma origem → o <img> envia o cookie de sessão). A URL leva
// `?v=<updatedAt>`, então o cache pode ser imutável: editar o contato gera uma
// URL nova (ver lib/friend-image.ts).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  if (!userId) return new NextResponse("Não autenticado", { status: 401 });

  const friend = await prisma.friend.findFirst({
    where: { id, userId },
    select: { imageUrl: true },
  });
  const parsed = friend?.imageUrl ? parseBase64DataUrl(friend.imageUrl) : null;
  if (!parsed) return new NextResponse("Imagem não encontrada", { status: 404 });

  const bytes = Buffer.from(parsed.data, "base64");
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": parsed.mime,
      "Content-Length": String(bytes.length),
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
