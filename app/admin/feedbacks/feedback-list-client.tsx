"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Feedback = {
  id: string;
  type: string;
  status: "PENDENTE" | "RESOLVIDO";
  message: string;
  anonymousName?: string | null;
  userId?: string | null;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  } | null;
};

export function FeedbackListClient({ initialFeedbacks }: { initialFeedbacks: Feedback[] }) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>(initialFeedbacks);
  const [filter, setFilter] = useState<"TODOS" | "PENDENTE" | "RESOLVIDO">("TODOS");

  const filteredFeedbacks = feedbacks.filter((f) => {
    if (filter === "TODOS") return true;
    const status = f.status || "PENDENTE";
    return status === filter;
  });

  async function handleStatusUpdate(id: string, newStatus: "PENDENTE" | "RESOLVIDO") {
    try {
      const res = await fetch(`/api/admin/feedbacks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setFeedbacks((prev) =>
          prev.map((f) => (f.id === id ? { ...f, status: newStatus } : f))
        );
        toast.success(newStatus === "RESOLVIDO" ? "Feedback marcado como resolvido!" : "Feedback marcado como pendente.");
      } else {
        toast.error("Erro ao atualizar status.");
      }
    } catch (error) {
      toast.error("Erro de conexão.");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Tem certeza que deseja excluir permanentemente este feedback?")) return;

    try {
      const res = await fetch(`/api/admin/feedbacks/${id}`, { method: "DELETE" });

      if (res.ok) {
        setFeedbacks((prev) => prev.filter((f) => f.id !== id));
        toast.success("Feedback excluído com sucesso.");
      } else {
        toast.error("Erro ao excluir feedback.");
      }
    } catch (error) {
      toast.error("Erro de conexão.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-[#e2e8f0] pb-4 dark:border-[#252a35]">
        <button
          onClick={() => setFilter("TODOS")}
          className={`px-4 py-2 text-sm font-bold transition-all rounded-md ${
            filter === "TODOS" ? "bg-slate-600 text-white" : "text-[#64748b] hover:bg-slate-100 dark:hover:bg-[#1a1d23]"
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter("PENDENTE")}
          className={`px-4 py-2 text-sm font-bold transition-all rounded-md ${
            filter === "PENDENTE" ? "bg-blue-600 text-white" : "text-[#64748b] hover:bg-slate-100 dark:hover:bg-[#1a1d23]"
          }`}
        >
          Pendentes
        </button>
        <button
          onClick={() => setFilter("RESOLVIDO")}
          className={`px-4 py-2 text-sm font-bold transition-all rounded-md ${
            filter === "RESOLVIDO" ? "bg-emerald-600 text-white" : "text-[#64748b] hover:bg-slate-100 dark:hover:bg-[#1a1d23]"
          }`}
        >
          Resolvidos
        </button>
      </div>

      <div className="space-y-4">
        {filteredFeedbacks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#e2e8f0] bg-white py-12 text-center dark:border-[#252a35] dark:bg-[#1a1d23]">
            <p className="text-[#64748b] dark:text-slate-400">Nenhum feedback {filter !== "TODOS" ? filter.toLowerCase() : ""} encontrado.</p>
          </div>
        ) : (
          filteredFeedbacks.map((f) => {
            const date = new Date(f.createdAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
            
            const currentStatus = f.status || "PENDENTE";
            const isBug = f.type === "BUG";
            const isSuggestion = f.type === "SUGGESTION";
            const isElogio = f.type === "ELOGIO";
            
            let typeLabel = f.type;
            let typeColor = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
            
            if (isBug) {
              typeLabel = "Bug / Erro";
              typeColor = "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";
            } else if (isSuggestion) {
              typeLabel = "Sugestão";
              typeColor = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
            } else if (isElogio) {
              typeLabel = "Elogio";
              typeColor = "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
            }

            const userName = f.userId && f.user ? f.user.name : (f.anonymousName || "Anônimo");
            const userEmail = f.userId && f.user ? f.user.email : null;

            return (
              <div key={f.id} className={`rounded-xl border p-5 shadow-sm transition-all ${
                currentStatus === "RESOLVIDO" 
                  ? "bg-slate-50/50 border-[#e2e8f0] opacity-75 dark:bg-[#141720] dark:border-[#252a35]" 
                  : "bg-white border-[#e2e8f0] dark:bg-[#1a1d23] dark:border-[#252a35]"
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${typeColor}`}>
                      {typeLabel}
                    </span>
                    {currentStatus === "RESOLVIDO" && (
                      <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white">
                        Resolvido
                      </span>
                    )}
                    <span className="text-[11px] font-bold text-[#94a3b8]">{date}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-[#1a1d23] dark:text-white">{userName}</p>
                    {userEmail && <p className="text-[10px] text-[#64748b] dark:text-slate-400">{userEmail}</p>}
                  </div>
                </div>

                <div className="rounded-lg bg-[#f8fafc] p-4 text-sm text-[#475569] dark:bg-[#0f1117] dark:text-slate-300 whitespace-pre-wrap leading-relaxed mb-4">
                  {f.message}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-[#e2e8f0] pt-4 dark:border-[#252a35]">
                  {currentStatus === "PENDENTE" ? (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                      onClick={() => handleStatusUpdate(f.id, "RESOLVIDO")}
                    >
                      Marcar como Resolvido
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-[#64748b] font-bold"
                      onClick={() => handleStatusUpdate(f.id, "PENDENTE")}
                    >
                      Reabrir Feedback
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="font-bold"
                    onClick={() => handleDelete(f.id)}
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
