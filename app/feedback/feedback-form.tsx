"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const FEEDBACK_TYPES = [
  { id: "BUG", label: "Relatar um Bug" },
  { id: "SUGGESTION", label: "Sugestão de Melhoria" },
  { id: "ELOGIO", label: "Elogio" },
  { id: "OUTRO", label: "Outros" },
];

export function FeedbackForm() {
  const [type, setType] = useState("");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [anonymousName, setAnonymousName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!type || !message.trim()) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type, 
          message: message.trim(), 
          isAnonymous,
          anonymousName: isAnonymous ? anonymousName.trim() : ""
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Feedback enviado com sucesso! Obrigado.");
        setType("");
        setMessage("");
        setAnonymousName("");
      } else {
        toast.error(data.error || "Erro ao enviar feedback.");
      }
    } catch (error) {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-sm dark:border-[#252a35] dark:bg-[#1a1d23]">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-[#1a1d23] dark:text-white mb-2">
            Sobre o que você quer falar?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FEEDBACK_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={`flex items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                  type === t.id
                    ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                    : "border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc] dark:border-[#252a35] dark:text-slate-400 dark:hover:bg-[#252a35]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-lg bg-[#f8fafc] p-4 dark:bg-[#0f1117] border border-[#e2e8f0] dark:border-[#252a35]">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="anonymous" className="text-sm font-medium text-[#475569] dark:text-slate-300 cursor-pointer">
              Enviar anonimamente (seu ID não será vinculado ao registro)
            </label>
          </div>
          
          {isAnonymous && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
              <label htmlFor="name" className="block text-xs font-semibold text-[#64748b] dark:text-slate-400 mb-1.5">
                Quer deixar seu nome? (Opcional)
              </label>
              <input
                type="text"
                id="name"
                value={anonymousName}
                onChange={(e) => setAnonymousName(e.target.value)}
                placeholder="Seu nome ou apelido..."
                className="w-full rounded-md border border-[#e2e8f0] bg-white px-3 py-2 text-xs text-[#1a1d23] placeholder-[#94a3b8] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-[#252a35] dark:bg-[#1a1d23] dark:text-white"
              />
            </div>
          )}
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-semibold text-[#1a1d23] dark:text-white mb-2">
            Sua mensagem
          </label>
          <textarea
            id="message"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Conte-nos o que aconteceu, sua ideia ou opinião..."
            className="w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm text-[#1a1d23] placeholder-[#94a3b8] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-[#252a35] dark:bg-[#0f1117] dark:text-white"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-11 text-base font-bold"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Enviando..." : "Enviar Feedback"}
        </Button>
      </form>
    </div>
  );
}
