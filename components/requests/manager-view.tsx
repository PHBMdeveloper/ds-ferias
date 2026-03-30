import { getRoleLevel } from "@/lib/vacationRules";
import {
  getManagerOptions,
  getDepartmentOptions,
  getTeamOptions,
  filterRequests,
  buildExportQuery,
  sliceHistoricoPage,
} from "@/lib/dashboardFilters";
import { EmptyState } from "@/components/layout/empty-state";
import { ExportButton } from "@/components/layout/export-button";
import { FilterForm } from "@/components/requests/filter-form";
import { HistoricoPagination } from "@/components/requests/historico-pagination";
import { RequestCard } from "@/components/requests/request-card";
import { RequestsGroupedByManager } from "@/components/requests/requests-grouped-by-manager";
import type { DashboardFilters } from "@/types/dashboard";

type RequestLike = {
  id: string;
  userId: string;
  status: string;
  startDate: Date | string;
  endDate: Date | string;
  notes?: string | null;
  abono?: boolean;
  thirteenth?: boolean;
  user?: {
    name?: string;
    role?: string;
    department?: string | null;
    team?: string | null;
    manager?: { id: string; name: string } | null;
  };
  history?: Array<{
    newStatus?: string;
    changedByUser?: { role?: string | null } | null;
  }>;
};

export function ManagerView({
  userRole,
  userId,
  requests,
  visibleCount,
  blackouts,
  filters,
}: {
  userRole: string;
  userId: string;
  requests: RequestLike[];
  visibleCount: number;
  blackouts: unknown[];
  filters: DashboardFilters;
}) {
  const view = filters.view === "historico" ? "historico" : "inbox";
  const managerOptions = getManagerOptions(userRole, requests);
  const deptOptions = getDepartmentOptions(requests);
  const teamOptions = getTeamOptions(requests);
  const filteredRequests = filterRequests(userRole, userId, requests, filters);
  const userLevel = getRoleLevel(userRole);

  const historicoSlice =
    view === "historico"
      ? sliceHistoricoPage(filteredRequests, filters.page ?? 1)
      : null;
  const displayRequests = historicoSlice ? historicoSlice.items : filteredRequests;

  const emptyMessage =
    view === "historico"
      ? "No Histórico aparecem apenas solicitações já processadas (aprovadas ou reprovadas). Pedidos pendentes de aprovação aparecem na aba Caixa de Aprovação."
      : visibleCount === 0
      ? "Nenhuma solicitação da sua equipe no momento."
      : "Nenhuma solicitação encontrada com os filtros aplicados.";

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="space-y-4">
        <FilterForm
          userRole={userRole}
          filters={filters}
          managerOptions={managerOptions}
          deptOptions={deptOptions}
          teamOptions={teamOptions}
          view={view}
        />
        <div className="flex flex-wrap items-center justify-end gap-3">
          <ExportButton href={`/api/vacation-requests/export?${buildExportQuery(filters)}`} />
          {userLevel >= 5 && (
            <>
              <a
                href="/api/reports/balance"
                download
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-900 transition-colors hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-200 dark:hover:bg-blue-950/70"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h1m-4 4l-2-2m2 2l2-2M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Saldos (CSV)
              </a>
              <a
                href="/api/reports/acquisition-periods"
                download
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-900 transition-colors hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-200 dark:hover:bg-blue-950/70"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ciclos (CSV)
              </a>
            </>
          )}
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <div className="space-y-6">
          {userLevel >= 4 ? (
            <RequestsGroupedByManager requests={displayRequests} userId={userId} userRole={userRole} />
          ) : (
            <div className="space-y-4 lg:space-y-5">
              <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/20 dark:bg-blue-950/10">
                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  {view === "inbox" 
                    ? "Visualizando solicitações aguardando sua ação." 
                    : "Histórico de solicitações processadas pela sua gestão."}
                </p>
              </div>
              {displayRequests.map((r) => (
                <RequestCard key={r.id} request={r} userId={userId} userRole={userRole} />
              ))}
            </div>
          )}
          {view === "historico" && historicoSlice && historicoSlice.totalItems > 0 && (
            <div className="pt-4">
              <HistoricoPagination
                filters={filters}
                page={historicoSlice.page}
                totalPages={historicoSlice.totalPages}
                totalItems={historicoSlice.totalItems}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
