"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChangePasswordFormCard } from "@/app/change-password/change-password-form";
import { getRoleLabel } from "@/lib/vacationRules";

type ProfileData = {
  id: string;
  name: string;
  email: string;
  role: string;
  team: string | null;
  hireDate: string | null;
  avatarUrl: string | null;
  coordinator: string | null;
  manager: string | null;
  director: string | null;
};

type Props = {
  profile: ProfileData;
};

export function ProfileClient({ profile }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatarUrl);
  const [savingAvatar, setSavingAvatar] = useState(false);

  function formatDate(dateIso: string | null) {
    if (!dateIso) return "-";
    const parsed = new Date(dateIso);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleDateString("pt-BR");
  }

  function triggerFilePicker() {
    fileInputRef.current?.click();
  }

  async function saveAvatar(avatarDataUrl: string | null, removeAvatar = false) {
    setSavingAvatar(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          removeAvatar,
          avatarDataUrl,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "Não foi possível salvar a foto.");
        setSavingAvatar(false);
        return;
      }
      setAvatarPreview(data?.avatarUrl ?? null);
      toast.success(removeAvatar ? "Foto removida com sucesso." : "Foto atualizada com sucesso.");
      router.refresh();
    } catch {
      toast.error("Erro de conexão ao atualizar foto.");
    } finally {
      setSavingAvatar(false);
    }
  }

  function onFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Formato inválido. Use PNG, JPG ou WEBP.");
      event.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result.startsWith("data:image/")) {
        toast.error("Não foi possível processar a imagem.");
        return;
      }
      void saveAvatar(result, false);
    };
    reader.onerror = () => toast.error("Erro ao ler arquivo.");
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm dark:border-[#252a35] dark:bg-[#1a1d23]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#1a1d23] dark:text-white">Perfil</h2>
            <p className="text-sm text-[#64748b] dark:text-slate-400">
              Seus dados pessoais e informações de hierarquia.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-3">
          <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4 dark:border-[#252a35] dark:bg-[#0f1117]">
            <div className="flex items-center gap-4">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreview} alt={`Foto de ${profile.name}`} className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm text-[#64748b] dark:text-slate-400">Foto de perfil</p>
                <p className="text-xs text-[#94a3b8] dark:text-slate-500">Opcional, até 2MB (PNG/JPG/WEBP)</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={triggerFilePicker}
                disabled={savingAvatar}
                className="min-h-[40px] rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingAvatar ? "Salvando..." : "Alterar foto"}
              </button>
              <button
                type="button"
                onClick={() => void saveAvatar(null, true)}
                disabled={savingAvatar || !avatarPreview}
                className="min-h-[40px] rounded-md border border-[#e2e8f0] bg-white px-4 text-sm font-semibold text-[#334155] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#252a35] dark:bg-[#111827] dark:text-slate-200"
              >
                Remover
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={onFileSelected}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4 dark:border-[#252a35] dark:bg-[#0f1117] lg:col-span-2">
            <ProfileRow label="Nome" value={profile.name} />
            <ProfileRow label="E-mail" value={profile.email} />
            <ProfileRow label="Papel" value={getRoleLabel(profile.role)} />
            <ProfileRow label="Data de entrada" value={formatDate(profile.hireDate)} />
            <ProfileRow label="Time" value={profile.team || "-"} />
            <ProfileRow label="Coordenador(a)" value={profile.coordinator || "-"} />
            <ProfileRow label="Gerente" value={profile.manager || "-"} />
            <ProfileRow label="Diretor(a)" value={profile.director || "-"} />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm dark:border-[#252a35] dark:bg-[#1a1d23]">
        <h3 className="text-lg font-bold text-[#1a1d23] dark:text-white">Segurança</h3>
        <p className="mb-4 text-sm text-[#64748b] dark:text-slate-400">Troque sua senha sempre que precisar.</p>
        <div className="max-w-xl">
          <ChangePasswordFormCard redirectTo="/profile" submitLabel="Atualizar senha" />
        </div>
      </section>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-[#e2e8f0] pb-2 last:border-b-0 last:pb-0 sm:grid-cols-[170px_1fr] dark:border-[#252a35]">
      <span className="text-sm font-medium text-[#64748b] dark:text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-[#1e293b] dark:text-slate-100">{value}</span>
    </div>
  );
}
