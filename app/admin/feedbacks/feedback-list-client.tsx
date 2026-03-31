"use client";

import { useState, useMemo } from "react";
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

const ITEMS_PER_PAGE = 10;

export function FeedbackListClient({ initialFeedbacks }: { initialFeedbacks: Feedback[] }) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>(initialFeedbacks);
  const [filter, setFilter] = useState<"TODOS" | "PENDENTE" | "RESOLVIDO">("TODOS");
  const [currentPage, setCurrentPage] = useState(1);

  // Filtragem
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((f) => {
      if (filter === "TODOS") return true;
      const status = f.status || "PENDENTE";
      return status === filter;
    });
  }, [feedbacks, filter]);

  // Paginação
  const totalPages = Math.max(1, Math.ceil(filteredFeedbacks.length / ITEMS_PER_PAGE));
  
  // Garantir que a página atual não ultrapasse o total após uma filtragem ou exclusão
  const safePage = Math.min(currentPage, totalPages);
  
  const paginatedFeedbacks = useMemo(() => {
    const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredFeedbacks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredFeedbacks, safePage]);

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

  function handleFilterChange(newFilter: typeof filter) {
    setFilter(newFilter);
    setCurrentPage(1); // Reseta para a primeira página ao filtrar
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-4 dark:border-[#252a35]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleFilterChange("TODOS")}
            className={`px-4 py-2 text-sm font-bold transition-all rounded-md ${
              filter === "TODOS" ? "bg-slate-600 text-white" : "text-[#64748b] hover:bg-slate-100 dark:hover:bg-[#1a1d23]"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => handleFilterChange("PENDENTE")}
            className={`px-4 py-2 text-sm font-bold transition-all rounded-md ${
              filter === "PENDENTE" ? "bg-blue-600 text-white" : "text-[#64748b] hover:bg-slate-100 dark:hover:bg-[#1a1d23]"
            }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => handleFilterChange("RESOLVIDO")}
            className={`px-4 py-2 text-sm font-bold transition-all rounded-md ${
              filter === "RESOLVIDO" ? "bg-emerald-600 text-white" : "text-[#64748b] hover:bg-slate-100 dark:hover:bg-[#1a1d23]"
            }`}
          >
            Resolvidos
          </button>
        </div>
        
        <div className="text-sm text-[#64748b] dark:text-slate-400 font-medium">
          Mostrando {filteredFeedbacks.length} feedback(s)
        </div>
      </div>

      <div className="space-y-4">
        {paginatedFeedbacks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#e2e8f0] bg-white py-12 text-center dark:border-[#252a35] dark:bg-[#1a1d23]">
            <p className="text-[#64748b] dark:text-slate-400">Nenhum feedback {filter !== "TODOS" ? filter.toLowerCase() : ""} encontrado.</p>
          </div>
        ) : (
          paginatedFeedbacks.map((f) => {
            const date = new Date(f.createdAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
            
            const currentStatus = f.status || "PENDENTE";
            
            let typeLabel = f.type;
            let typeColor = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
            
            if (f.type === "BUG") {
              typeLabel = "Bug / Erro";
              typeColor = "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";
            } else if (f.type === "SUGGESTION") {
              typeLabel = "Sugestão";
              typeColor = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
            } else if (f.type === "ELOGIO") {
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

      {/* Controles de Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="font-bold"
          >
            Anterior
          </Button>
          <span className="text-sm font-semibold text-[#475569] dark:text-slate-300">
            Página {safePage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="font-bold"
          >
            Próximo
          </Button>
        </div>
      )}
    </div>
  );
}
