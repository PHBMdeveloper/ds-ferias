"use client";

import { useState } from "react";

type CalendarEntry = {
  startDate: Date | string;
  endDate: Date | string;
  status: string;
  abono?: boolean;
  thirteenth?: boolean;
};

type Props = {
  entries: CalendarEntry[];
};

const APPROVED_CALENDAR =
  "bg-emerald-300 text-emerald-950 dark:bg-emerald-800/80 dark:text-emerald-100";

const STATUS_COLOR: Record<string, string> = {
  PENDENTE: "bg-amber-300 text-amber-950 dark:bg-amber-800/80 dark:text-amber-100",
  APROVADO_COORDENADOR: APPROVED_CALENDAR,
  APROVADO_GESTOR: APPROVED_CALENDAR,
  APROVADO_GERENTE: APPROVED_CALENDAR,
  APROVADO_DIRETOR: APPROVED_CALENDAR,
  APROVADO_RH: APPROVED_CALENDAR,
  REPROVADO: "bg-red-200 text-red-900 dark:bg-red-900/60 dark:text-red-200",
  CANCELADO: "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-200",
};

function getStatusColor(status: string): string {
  return STATUS_COLOR[status] ?? "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200";
}

function getStatusRing(status: string): string {
  if (status === "PENDENTE") return "ring-1 ring-amber-500/70";
  if (status.startsWith("APROVADO_") || status === "APROVADO_GESTOR") return "ring-1 ring-emerald-600/60";
  return "ring-0";
}

export function MonthlyCalendar({ entries }: Props) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [viewMode, setViewMode] = useState<"month" | "year">("month");

  const getMonthCells = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstWeekday = firstDay.getDay(); // 0 (dom) - 6 (sáb)
    const blanks = (firstWeekday + 6) % 7; // alinhar para semana começando em segunda
    const cells: { day: number; statuses: string[]; hasAbono: boolean; hasThirteenth: boolean }[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const current = new Date(year, month, d);
      const matching = entries.filter((e) => {
        const start = new Date(e.startDate);
        const endRaw = new Date(e.endDate);
        // Se houver abono 1/3, destacamos apenas o período estimado de descanso (até 10 dias a menos)
        const end =
          e.abono && !isNaN(endRaw.getTime())
            ? new Date(endRaw.getTime() - 10 * 24 * 60 * 60 * 1000)
            : endRaw;
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        return current >= start && current <= end;
      });
      cells.push({
        day: d,
        statuses: matching.map((e) => e.status),
        hasAbono: matching.some((e) => e.abono),
        hasThirteenth: matching.some((e) => e.thirteenth),
      });
    }

    return { blanks, cells };
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const monthData = getMonthCells(year, month);

  const renderDayCell = (
    day: number,
    statuses: string[],
    hasAbono: boolean,
    hasThirteenth: boolean,
    cellMonth: number,
    cellYear: number,
    compact = false,
  ) => {
    const isToday =
      day === today.getDate() &&
      cellMonth === today.getMonth() &&
      cellYear === today.getFullYear();
    const hasStatus = statuses.length > 0;
    const mainStatus = hasStatus ? statuses[0] : "";
    return (
      <div
        key={day}
        className={[
          "flex flex-col items-center justify-center rounded-md border",
          compact ? "h-7 text-[9px]" : "h-10 text-[10px]",
          isToday ? "border-blue-500" : "border-transparent",
          hasStatus ? getStatusColor(mainStatus) : "bg-[#f5f6f8] dark:bg-[#0f1117] text-[#475569] dark:text-slate-300",
          hasStatus ? getStatusRing(mainStatus) : "ring-0",
        ].join(" ")}
      >
        <span className="font-semibold leading-none">{day}</span>
        {hasStatus && (
          <span
            className={[
              "mt-0.5 h-1 w-1 rounded-full",
              mainStatus === "PENDENTE" ? "bg-amber-700 dark:bg-amber-200" : "bg-emerald-700 dark:bg-emerald-200",
            ].join(" ")}
          />
        )}
        {(hasAbono || hasThirteenth) && !compact && (
          <span className="mt-0.5 flex gap-0.5">
            {hasAbono && <span className="rounded-sm bg-emerald-600 px-0.5 text-[8px] font-semibold text-white">A</span>}
            {hasThirteenth && <span className="rounded-sm bg-amber-600 px-0.5 text-[8px] font-semibold text-white">13</span>}
          </span>
        )}
      </div>
    );
  };

  const monthLabel = currentMonth.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <section aria-label="Calendário de férias" className="rounded-lg border border-[#e2e8f0] bg-white p-4 dark:border-[#252a35] dark:bg-[#1a1d23]">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-[#1a1d23] dark:text-white">
          {viewMode === "month" ? "Calendário deste mês" : "Visão anual de férias"}
        </h4>
        <div className="flex items-center gap-2">
          <div className="rounded-md border border-[#e2e8f0] p-0.5 dark:border-[#252a35]">
            <button
              type="button"
              className={[
                "rounded px-2 py-1 text-[11px] font-medium",
                viewMode === "month"
                  ? "bg-blue-600 text-white"
                  : "text-[#64748b] hover:bg-[#f5f6f8] dark:text-slate-300 dark:hover:bg-[#1e2330]",
              ].join(" ")}
              onClick={() => setViewMode("month")}
            >
              Mês
            </button>
            <button
              type="button"
              className={[
                "rounded px-2 py-1 text-[11px] font-medium",
                viewMode === "year"
                  ? "bg-blue-600 text-white"
                  : "text-[#64748b] hover:bg-[#f5f6f8] dark:text-slate-300 dark:hover:bg-[#1e2330]",
              ].join(" ")}
              onClick={() => setViewMode("year")}
            >
              Ano
            </button>
          </div>
          <button
            type="button"
            aria-label={viewMode === "month" ? "Mês anterior" : "Ano anterior"}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-[#e2e8f0] text-xs text-[#64748b] hover:bg-[#f5f6f8] dark:border-[#252a35] dark:text-slate-300 dark:hover:bg-[#1e2330]"
            onClick={() =>
              setCurrentMonth((prev) =>
                viewMode === "month"
                  ? new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                  : new Date(prev.getFullYear() - 1, prev.getMonth(), 1),
              )
            }
          >
            ‹
          </button>
          <span className="min-w-[96px] text-center text-xs text-[#64748b] dark:text-slate-400 capitalize">
            {viewMode === "month" ? monthLabel : String(year)}
          </span>
          <button
            type="button"
            aria-label={viewMode === "month" ? "Próximo mês" : "Próximo ano"}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-[#e2e8f0] text-xs text-[#64748b] hover:bg-[#f5f6f8] dark:border-[#252a35] dark:text-slate-300 dark:hover:bg-[#1e2330]"
            onClick={() =>
              setCurrentMonth((prev) =>
                viewMode === "month"
                  ? new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                  : new Date(prev.getFullYear() + 1, prev.getMonth(), 1),
              )
            }
          >
            ›
          </button>
        </div>
      </div>
      {viewMode === "month" ? (
        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-[#64748b] dark:text-slate-400">
          {["S", "T", "Q", "Q", "S", "S", "D"].map((dow, index) => (
            <div key={`dow-${index}`} className="py-1 font-medium">
              {dow}
            </div>
          ))}
          {Array.from({ length: monthData.blanks }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {monthData.cells.map(({ day, statuses, hasAbono, hasThirteenth }) =>
            renderDayCell(day, statuses, hasAbono, hasThirteenth, month, year),
          )}
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-2 text-[10px] text-[#64748b] dark:text-slate-400">
            <span className={["inline-flex items-center gap-1 rounded-full px-2 py-0.5", getStatusColor("PENDENTE")].join(" ")}>
              <span className="h-1.5 w-1.5 rounded-full bg-current/80" /> Férias pendentes
            </span>
            <span className={["inline-flex items-center gap-1 rounded-full px-2 py-0.5", getStatusColor("APROVADO_GERENTE")].join(" ")}>
              <span className="h-1.5 w-1.5 rounded-full bg-current/80" /> Férias aprovadas
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white">
              Dias com abono 1/3
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 12 }).map((_, monthIndex) => {
            const data = getMonthCells(year, monthIndex);
            const monthTitle = new Date(year, monthIndex, 1).toLocaleDateString("pt-BR", {
              month: "long",
            });
            const approvedCount = data.cells.filter((c) =>
              c.statuses.some((s) => s.startsWith("APROVADO_") || s === "APROVADO_GESTOR"),
            ).length;
            const pendingCount = data.cells.filter((c) => c.statuses.includes("PENDENTE")).length;
            return (
              <div
                key={`year-month-${monthIndex}`}
                className="rounded-md border border-[#e2e8f0] p-2 dark:border-[#252a35]"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold capitalize text-[#1a1d23] dark:text-white">
                    {monthTitle}
                  </p>
                  <span className="text-[10px] text-[#64748b] dark:text-slate-400">
                    {pendingCount > 0 ? `P:${pendingCount} ` : ""}
                    {approvedCount > 0 ? `A:${approvedCount}` : ""}
                  </span>
                </div>
                <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[9px] text-[#94a3b8] dark:text-slate-400">
                  {["S", "T", "Q", "Q", "S", "S", "D"].map((dow, i) => (
                    <div key={`year-dow-${monthIndex}-${i}`} className="font-medium">
                      {dow}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-0.5 text-center text-[9px] text-[#64748b] dark:text-slate-400">
                  {Array.from({ length: data.blanks }).map((_, i) => (
                    <div key={`year-blank-${monthIndex}-${i}`} />
                  ))}
                  {data.cells.map(({ day, statuses, hasAbono, hasThirteenth }) =>
                    renderDayCell(day, statuses, hasAbono, hasThirteenth, monthIndex, year, true),
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-[#64748b] dark:text-slate-400">
        <span className="font-semibold">Legenda:</span>
        <span className={["inline-flex items-center gap-1 rounded-full px-2 py-0.5", getStatusColor("PENDENTE")].join(" ")}>
          <span className="h-1.5 w-1.5 rounded-full bg-current/80" /> Pendente
        </span>
        <span className={["inline-flex items-center gap-1 rounded-full px-2 py-0.5", getStatusColor("APROVADO_GERENTE")].join(" ")}>
          <span className="h-1.5 w-1.5 rounded-full bg-current/80" /> Aprovado
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white">
          <span className="rounded-sm bg-white/20 px-1 text-[9px]">A</span> Dia com pedido de abono 1/3 (retorno até 10 dias antes)
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-semibold text-white">
          <span className="rounded-sm bg-white/20 px-1 text-[9px]">13</span> Dia com pedido de adiantamento de 13º
        </span>
      </div>
    </section>
  );
}

