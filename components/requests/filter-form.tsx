"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getRoleLevel } from "@/lib/vacationRules";
import { Button } from "@/components/ui/button";
import type { DashboardFilters } from "@/types/dashboard";

type Props = {
  userRole: string;
  filters: DashboardFilters;
  managerOptions: Array<{ id: string; name: string }>;
  deptOptions: string[];
  teamOptions: string[];
  view: string;
};

export function FilterForm({
  userRole,
  filters,
  managerOptions,
  deptOptions,
  teamOptions,
  view,
}: Props) {
  const userLevel = getRoleLevel(userRole);

  // ---- Caixa de Aprovação (inbox): tudo é `PENDENTE`, então remove status + botão Filtrar
  // e aplica filtros automaticamente quando o usuário digita/seleciona.
  const router = useRouter();

  const initialManagerId =
    userLevel >= 4 && filters.managerId && filters.managerId !== "ALL" ? filters.managerId : "ALL";

  const [q, setQ] = useState(filters.query ?? "");
  const [managerId, setManagerId] = useState(initialManagerId);
  const [department, setDepartment] = useState(filters.department ?? "");
  const [team, setTeam] = useState(filters.team ?? "");
  const qDebounceRef = useRef<number | null>(null);

  useEffect(() => {
    // Sincroniza quando o server re-renderizar por mudança de query.
    setQ(filters.query ?? "");
    setManagerId(
      userLevel >= 4 && filters.managerId && filters.managerId !== "ALL" ? filters.managerId : "ALL",
    );
    setDepartment(filters.department ?? "");
    setTeam(filters.team ?? "");
  }, [filters.query, filters.managerId, filters.department, filters.team, userLevel]);

  const pushInbox = (next: {
    q?: string;
    managerId?: string;
    department?: string;
    team?: string;
  } = {}) => {
    const nextQ = typeof next.q === "string" ? next.q : q;
    const nextManagerId = typeof next.managerId === "string" ? next.managerId : managerId;
    const nextDepartment = typeof next.department === "string" ? next.department : department;
    const nextTeam = typeof next.team === "string" ? next.team : team;

    const params = new URLSearchParams();
    params.set("view", "inbox");
    const trimmed = nextQ.trim();
    if (trimmed.length >= 2) params.set("q", trimmed);
    if (userLevel >= 4 && nextManagerId && nextManagerId !== "ALL") params.set("managerId", nextManagerId);
    if (nextDepartment) params.set("department", nextDepartment);
    if (nextTeam) params.set("team", nextTeam);

    router.push(`/dashboard?${params.toString()}`);
  };

  const handleQChange = (next: string) => {
    setQ(next);

    const trimmed = next.trim();

    // Regra: só busca a partir da 2ª letra (ou limpa quando vazio).
    if (trimmed.length === 0) {
      if (qDebounceRef.current) window.clearTimeout(qDebounceRef.current);
      pushInbox({ q: "" });
      return;
    }

    if (trimmed.length === 1) return;

    if (qDebounceRef.current) window.clearTimeout(qDebounceRef.current);
    qDebounceRef.current = window.setTimeout(() => {
      pushInbox({ q: next });
    }, 300);
  };

  if (view === "inbox") {
    return (
      <div
        className="rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-sm dark:border-[#252a35] dark:bg-[#1a1d23]"
        aria-label="Filtros da Caixa de Aprovação"
      >
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-base font-bold text-[#1a1d23] dark:text-white">Aguardando Minha Aprovação</h3>
          <p className="text-xs font-medium text-[#64748b] dark:text-slate-500 uppercase tracking-widest">
              Busca em tempo real
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <input
              type="search"
              placeholder="Buscar colaborador..."
              value={q}
              onChange={(e) => handleQChange(e.target.value)}
              className="h-11 w-full rounded-lg border border-[#e2e8f0] bg-[#f5f6f8] px-4 text-sm text-[#1a1d23] placeholder:text-[#94a3b8] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-[#252a35] dark:bg-[#0f1117] dark:text-white"
            />
          </div>

          {userLevel >= 4 && managerOptions.length > 0 && (
            <select
              value={managerId}
              onChange={(e) => {
                const next = e.target.value;
                setManagerId(next);
                pushInbox({ managerId: next });
              }}
              className="h-11 w-full rounded-lg border border-[#e2e8f0] bg-[#f5f6f8] px-3 text-sm text-[#1a1d23] focus:border-blue-500 focus:outline-none dark:border-[#252a35] dark:bg-[#0f1117] dark:text-white"
            >
              <option value="ALL">Coordenadores: Todos</option>
              {managerOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          )}

          {deptOptions.length > 0 && (
            <select
              value={department}
              onChange={(e) => {
                const next = e.target.value;
                setDepartment(next);
                pushInbox({ department: next });
              }}
              className="h-11 w-full rounded-lg border border-[#e2e8f0] bg-[#f5f6f8] px-3 text-sm text-[#1a1d23] focus:border-blue-500 focus:outline-none dark:border-[#252a35] dark:bg-[#0f1117] dark:text-white"
            >
              <option value="">Departamentos: Todos</option>
              {deptOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}

          {teamOptions.length > 0 && (
            <select
              value={team}
              onChange={(e) => {
                const next = e.target.value;
                setTeam(next);
                pushInbox({ team: next });
              }}
              className="h-11 w-full rounded-lg border border-[#e2e8f0] bg-[#f5f6f8] px-3 text-sm text-[#1a1d23] focus:border-blue-500 focus:outline-none dark:border-[#252a35] dark:bg-[#0f1117] dark:text-white"
            >
              <option value="">Times: Todos</option>
              {teamOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    );
  }

  // ---- Histórico: mantém formulário tradicional com botão Filtrar
  return (
    <form
      method="get"
      className="rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-sm dark:border-[#252a35] dark:bg-[#1a1d23]"
    >
      <input type="hidden" name="view" value={view} />
      {view === "historico" && <input type="hidden" name="page" value="1" />}
      
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base font-bold text-[#1a1d23] dark:text-white">Histórico de Solicitações</h3>
        <p className="text-xs font-medium text-[#64748b] dark:text-slate-500 uppercase tracking-widest">
            Filtros do histórico
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <input
              type="search"
              name="q"
              placeholder="Buscar colaborador..."
              defaultValue={filters.query}
              className="h-11 w-full rounded-lg border border-[#e2e8f0] bg-[#f5f6f8] px-4 text-sm text-[#1a1d23] placeholder:text-[#94a3b8] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-[#252a35] dark:bg-[#0f1117] dark:text-white"
            />
          </div>
          <select
            name="status"
            defaultValue={filters.status}
            className="h-11 w-full rounded-lg border border-[#e2e8f0] bg-[#f5f6f8] px-3 text-sm text-[#1a1d23] focus:border-blue-500 focus:outline-none dark:border-[#252a35] dark:bg-[#0f1117] dark:text-white"
          >
            <option value="TODOS">Status: Todos</option>
            <option value="PENDENTE">Pendente aprovação</option>
            <option value="APROVADO_COORDENADOR">Aprovado (coordenador)</option>
            <option value="APROVADO_GERENTE">Aprovado (gerente)</option>
            <option value="APROVADO_DIRETOR">Aprovado (diretoria)</option>
            <option value="REPROVADO">Reprovado</option>
          </select>

          {userLevel >= 4 && managerOptions.length > 0 && (
            <select
              name="managerId"
              defaultValue={filters.managerId}
              className="h-11 w-full rounded-lg border border-[#e2e8f0] bg-[#f5f6f8] px-3 text-sm text-[#1a1d23] focus:border-blue-500 focus:outline-none dark:border-[#252a35] dark:bg-[#0f1117] dark:text-white"
            >
              <option value="ALL">Coordenadores: Todos</option>
              {managerOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {deptOptions.length > 0 && (
            <select
              name="department"
              defaultValue={filters.department}
              className="h-11 w-full rounded-lg border border-[#e2e8f0] bg-[#f5f6f8] px-3 text-sm text-[#1a1d23] focus:border-blue-500 focus:outline-none dark:border-[#252a35] dark:bg-[#0f1117] dark:text-white"
            >
              <option value="">Departamentos: Todos</option>
              {deptOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}

          {teamOptions.length > 0 && (
            <select
              name="team"
              defaultValue={filters.team ?? ""}
              className="h-11 w-full rounded-lg border border-[#e2e8f0] bg-[#f5f6f8] px-3 text-sm text-[#1a1d23] focus:border-blue-500 focus:outline-none dark:border-[#252a35] dark:bg-[#0f1117] dark:text-white"
            >
              <option value="">Times: Todos</option>
              {teamOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}

          {userLevel >= 4 && (
            <>
              <input
                type="date"
                name="from"
                defaultValue={filters.from}
                title="Início a partir de"
                className="h-11 w-full rounded-lg border border-[#e2e8f0] bg-[#f5f6f8] px-3 text-sm focus:border-blue-500 focus:outline-none dark:border-[#252a35] dark:bg-[#0f1117] dark:text-white"
              />
              <input
                type="date"
                name="to"
                defaultValue={filters.to}
                title="Fim até"
                className="h-11 w-full rounded-lg border border-[#e2e8f0] bg-[#f5f6f8] px-3 text-sm focus:border-blue-500 focus:outline-none dark:border-[#252a35] dark:bg-[#0f1117] dark:text-white"
              />
            </>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            className="h-11 bg-blue-600 px-6 text-sm font-bold text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/20"
          >
            Aplicar Filtros
          </Button>
        </div>
      </div>
    </form>
  );
}
