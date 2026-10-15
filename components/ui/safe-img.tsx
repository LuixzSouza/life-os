"use client";

// <img> com substituto: se a imagem externa falhar (link quebrado, site que
// bloqueia hotlink/ORB, logo inexistente), mostra o `fallback` em vez do ícone
// de imagem quebrada do navegador. Princípio do CLAUDE.md: imagem nunca é
// obrigatória e sempre tem um fallback bonito.

import { useState, type ImgHTMLAttributes, type ReactNode } from "react";

interface SafeImgProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string | null | undefined;
  /** O que mostrar sem imagem ou quando ela falhar. */
  fallback: ReactNode;
}

export function SafeImg({ src, fallback, onError, alt = "", ...props }: SafeImgProps) {
  // Guarda QUAL src falhou: trocar o src (outro item/edição) tenta de novo.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) return <>{fallback}</>;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={(e) => {
        setFailedSrc(src);
        onError?.(e);
      }}
      {...props}
    />
  );
}
