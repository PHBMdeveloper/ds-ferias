import { getRoleLabel } from "@/lib/vacationRules";
import type { TeamMemberInfoSerialized } from "./types";

type CoordTeam = {
  coordinatorId: string;
  coordinatorName: string;
  teamKey: string;
  teamName: string;
  members: TeamMemberInfoSerialized[];
};

/**
 * Calendário por squad do coordenador: opcionalmente inclui a própria coordenação (só no primeiro time).
 */
export function buildCoordTeamCalendarMembers(
  team: CoordTeam,
  coordinatorSelf: TeamMemberInfoSerialized | undefined,
  includeCoordinatorRow: boolean,
): TeamMemberInfoSerialized[] {
  const out: TeamMemberInfoSerialized[] = [];
  if (includeCoordinatorRow && coordinatorSelf) {
    out.push({
      ...coordinatorSelf,
      calendarCapacityGroupKey: `coord-self-${team.coordinatorId}`,
      calendarSectionOrder: 0,
      calendarSectionTitle: "Coordenação",
      calendarDisplayName: `${coordinatorSelf.user.name} · ${getRoleLabel(coordinatorSelf.user.role)}`,
    });
  }
  const baseOrder = includeCoordinatorRow && coordinatorSelf ? 1 : 0;
  const mems = [...team.members].sort((a, b) =>
    (a.user.name ?? "").localeCompare(b.user.name ?? "", "pt-BR", { sensitivity: "base" }),
  );
  mems.forEach((m) => {
    out.push({
      ...m,
      calendarCapacityGroupKey: team.teamKey,
      calendarSectionOrder: baseOrder,
      calendarSectionTitle: team.teamName,
      calendarDisplayName: `${m.user.name} · ${getRoleLabel(m.user.role)}`,
    });
  });
  return out;
}
