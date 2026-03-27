import { redirect } from "next/navigation";
import { getSessionUser, shouldForcePasswordChange } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppSidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { getMyVacationSidebarContext } from "@/services/dashboardDataService";
import { getRoleLabel } from "@/lib/vacationRules";
import { ProfileClient } from "./profile-client";

type HierarchyName = {
  name: string;
  role: string;
};

function extractHierarchy(
  role: string,
  leaders: Array<HierarchyName | null | undefined>,
): { coordinator: string | null; manager: string | null; director: string | null } {
  const result = {
    coordinator: role === "COORDENADOR" || role === "GESTOR" ? "Você" : null,
    manager: role === "GERENTE" ? "Você" : null,
    director: role === "DIRETOR" ? "Você" : null,
  };

  for (const leader of leaders) {
    if (!leader) continue;
    if (!result.coordinator && (leader.role === "COORDENADOR" || leader.role === "GESTOR")) {
      result.coordinator = leader.name;
    }
    if (!result.manager && leader.role === "GERENTE") {
      result.manager = leader.name;
    }
    if (!result.director && leader.role === "DIRETOR") {
      result.director = leader.name;
    }
  }
  return result;
}

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (shouldForcePasswordChange(user)) redirect("/change-password");

  const [sidebarCtx, me] = await Promise.all([
    getMyVacationSidebarContext(user.id),
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        team: true,
        hireDate: true,
        avatarUrl: true,
        manager: {
          select: {
            name: true,
            role: true,
            manager: {
              select: {
                name: true,
                role: true,
                manager: {
                  select: {
                    name: true,
                    role: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  if (!me) redirect("/login");

  const hierarchy = extractHierarchy(me.role, [me.manager, me.manager?.manager, me.manager?.manager?.manager]);

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f6f8] dark:bg-[#0f1117] lg:flex-row">
      <AppSidebar
        user={user}
        activeView="perfil"
        pendingCount={0}
        balance={sidebarCtx.balance}
        acquisitionPeriods={sidebarCtx.acquisitionPeriods as Array<{ accruedDays: number; usedDays: number }>}
        hasUpcomingVacation={false}
        department={sidebarCtx.department}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8" tabIndex={-1}>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#1a1d23] dark:text-white lg:text-3xl">Meu Perfil</h1>
            <p className="mt-1 text-base text-[#64748b] dark:text-slate-400 lg:text-lg">
              {me.name} · {getRoleLabel(me.role)}
            </p>
          </div>

          <ProfileClient
            profile={{
              id: me.id,
              name: me.name,
              email: me.email,
              role: me.role,
              team: me.team,
              hireDate: me.hireDate ? me.hireDate.toISOString() : null,
              avatarUrl: me.avatarUrl,
              coordinator: hierarchy.coordinator,
              manager: hierarchy.manager,
              director: hierarchy.director,
            }}
          />
        </main>
      </div>
    </div>
  );
}
