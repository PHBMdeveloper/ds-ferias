import { NextResponse } from "next/server";
import { getSessionUser, shouldForcePasswordChange } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2MB
const SUPPORTED_MIME = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

function isValidDataUrl(input: string): boolean {
  return /^data:image\/(png|jpeg|jpg|webp);base64,[a-zA-Z0-9+/=]+$/.test(input);
}

function estimateBase64Bytes(dataUrl: string): number {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) return Number.MAX_SAFE_INTEGER;
  const b64 = dataUrl.slice(commaIndex + 1);
  return Math.floor((b64.length * 3) / 4);
}

function extractMime(dataUrl: string): string {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
  return match?.[1]?.toLowerCase() ?? "";
}

export async function PATCH(request: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (shouldForcePasswordChange(session)) {
    return NextResponse.json({ error: "Você precisa trocar a senha antes de continuar." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || (!("avatarDataUrl" in body) && !("removeAvatar" in body))) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const removeAvatar = body.removeAvatar === true;
  const rawAvatar = typeof body.avatarDataUrl === "string" ? body.avatarDataUrl.trim() : "";

  if (!removeAvatar) {
    if (!rawAvatar || !isValidDataUrl(rawAvatar)) {
      return NextResponse.json({ error: "Imagem inválida. Envie PNG, JPG ou WEBP." }, { status: 400 });
    }
    const mime = extractMime(rawAvatar);
    if (!SUPPORTED_MIME.includes(mime)) {
      return NextResponse.json({ error: "Formato não suportado. Use PNG, JPG ou WEBP." }, { status: 400 });
    }
    if (estimateBase64Bytes(rawAvatar) > MAX_AVATAR_BYTES) {
      return NextResponse.json({ error: "Imagem muito grande. Limite de 2MB." }, { status: 400 });
    }
  }

  const updated = await prisma.user.update({
    where: { id: session.id },
    data: { avatarUrl: removeAvatar ? null : rawAvatar },
    select: { avatarUrl: true },
  });

  return NextResponse.json({ ok: true, avatarUrl: updated.avatarUrl });
}
