import Link from "next/link";
import type { DashboardFilters } from "@/types/dashboard";
import {
  buildHistoricoDashboardHref,
  HISTORICO_PAGE_SIZE,
} from "@/lib/dashboardFilters";

type Props = {
  filters: DashboardFilters;
  page: number;
  totalPages: number;
  totalItems: number;
};

export function HistoricoPagination({ filters, page, totalPages, totalItems }: Props) {
  if (totalItems === 0) return null;

  const from = (page - 1) * HISTORICO_PAGE_SIZE + 1;
  const to = Math.min(page * HISTORICO_PAGE_SIZE, totalItems);
  const prevHref = page > 1 ? buildHistoricoDashboardHref(filters, page - 1) : null;
  const nextHref = page < totalPages ? buildHistoricoDashboardHref(filters, page + 1) : null;

  return (
    <nav
      className="flex flex-col gap-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm text-[#475569] dark:border-[#252a35] dark:bg-[#141720] dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between"
      aria-label="Paginação do histórico"
    >
      <p className="text-[#64748b] dark:text-slate-400">
        Exibindo{" "}
        <span className="font-semibold text-[#1a1d23] dark:text-white">
          {from}–{to}
        </span>{" "}
        de <span className="font-semibold text-[#1a1d23] dark:text-white">{totalItems}</span>{" "}
        ({HISTORICO_PAGE_SIZE} por página)
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {prevHref ? (
          <Link
            href={prevHref}
            className="inline-flex min-h-[40px] items-center rounded-md border border-[#e2e8f0] bg-white px-3 py-2 font-semibold text-[#475569] hover:bg-[#f1f5f9] dark:border-[#252a35] dark:bg-[#1a1d23] dark:hover:bg-[#252a35]"
          >
            Anterior
          </Link>
        ) : (
          <span className="inline-flex min-h-[40px] cursor-not-allowed items-center rounded-md border border-transparent px-3 py-2 text-[#94a3b8] dark:text-slate-500">
            Anterior
          </span>
        )}
        <span className="px-2 font-medium tabular-nums" aria-current="page">
          Página {page} de {totalPages}
        </span>
        {nextHref ? (
          <Link
            href={nextHref}
            className="inline-flex min-h-[40px] items-center rounded-md border border-[#e2e8f0] bg-white px-3 py-2 font-semibold text-[#475569] hover:bg-[#f1f5f9] dark:border-[#252a35] dark:bg-[#1a1d23] dark:hover:bg-[#252a35]"
          >
            Próxima
          </Link>
        ) : (
          <span className="inline-flex min-h-[40px] cursor-not-allowed items-center rounded-md border border-transparent px-3 py-2 text-[#94a3b8] dark:text-slate-500">
            Próxima
          </span>
        )}
      </div>
    </nav>
  );
}
