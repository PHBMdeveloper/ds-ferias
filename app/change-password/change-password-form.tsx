"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function ChangePasswordForm() {
  return <ChangePasswordFormCard />;
}

type ChangePasswordFormProps = {
  redirectTo?: string;
  submitLabel?: string;
};

export function ChangePasswordFormCard({
  redirectTo = "/dashboard",
  submitLabel = "Salvar senha",
}: ChangePasswordFormProps = {}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 4) {
      toast.error("A senha deve ter pelo menos 4 dígitos.");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não conferem.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Erro ao trocar a senha.");
        setLoading(false);
        return;
      }
      toast.success("Senha alterada com sucesso.");
      setPassword("");
      setConfirm("");
      setLoading(false);
      router.replace(redirectTo);
      router.refresh();
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" aria-label="Trocar senha">
      <div>
        <label htmlFor="new-password" className="mb-1.5 block text-base font-medium text-[#1a1d23] dark:text-white">
          Nova senha
        </label>
        <div className="relative">
          <input
            id="new-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            disabled={loading}
            className="min-h-[44px] w-full rounded-md border border-[#e2e8f0] bg-white px-3 pr-24 text-base text-[#1a1d23] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-70 dark:border-[#252a35] dark:bg-[#1a1d23] dark:text-white"
            placeholder="Crie uma nova senha"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-sm font-medium text-[#475569] hover:bg-[#f1f5f9] disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-300 dark:hover:bg-[#252a35]"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="confirm-password" className="mb-1.5 block text-base font-medium text-[#1a1d23] dark:text-white">
          Confirmar nova senha
        </label>
        <div className="relative">
          <input
            id="confirm-password"
            type={showConfirm ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            disabled={loading}
            className="min-h-[44px] w-full rounded-md border border-[#e2e8f0] bg-white px-3 pr-24 text-base text-[#1a1d23] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-70 dark:border-[#252a35] dark:bg-[#1a1d23] dark:text-white"
            placeholder="Digite novamente"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-sm font-medium text-[#475569] hover:bg-[#f1f5f9] disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-300 dark:hover:bg-[#252a35]"
            aria-label={showConfirm ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"}
          >
            {showConfirm ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        aria-label="Salvar nova senha"
        className="flex min-h-[44px] w-full items-center justify-center rounded-md bg-blue-600 px-4 text-base font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Salvando..." : submitLabel}
      </button>
    </form>
  );
}

