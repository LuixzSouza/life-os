// Fotos de amigos (Friend.imageUrl) ficam como data URL base64 no banco.
// Embutidas no HTML, cada visita ao /social reenviava TODAS (~800 KB) sem cache.
// Agora as páginas recebem uma ref para /api/friend-image/[id], que o navegador
// cacheia. `?v=` muda quando o contato é editado → nunca serve foto velha.
// Módulo puro (sem prisma): usável no servidor e no cliente.

export const FRIEND_IMAGE_PREFIX = "/api/friend-image/";

/** Ref servida pela rota (não é o conteúdo da foto). */
export function isFriendImageRef(src: string | null | undefined): boolean {
  return !!src && src.startsWith(FRIEND_IMAGE_PREFIX);
}

/**
 * `src` para exibir a foto: data URL vira ref cacheável; URL externa e vazio
 * passam como estão.
 */
export function friendImageSrc(friend: {
  id: string;
  imageUrl: string | null;
  updatedAt: Date;
}): string | null {
  const { imageUrl } = friend;
  if (!imageUrl) return null;
  if (!imageUrl.startsWith("data:")) return imageUrl;
  return `${FRIEND_IMAGE_PREFIX}${friend.id}?v=${friend.updatedAt.getTime()}`;
}

/** Separa `data:<mime>;base64,<dados>`; null se não for data URL base64. */
export function parseBase64DataUrl(src: string): { mime: string; data: string } | null {
  const match = /^data:([^;,]+);base64,([\s\S]*)$/.exec(src);
  return match ? { mime: match[1], data: match[2] } : null;
}
