import { redirect } from "next/navigation";
import { getSessionUser, shouldForcePasswordChange } from "@/lib/auth";
import { getRoleLevel } from "@/lib/vacationRules";
import { prisma } from "@/lib/prisma";
import { AppSidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { getMyVacationSidebarContext } from "@/services/dashboardDataService";
import { FeedbackListClient } from "./feedback-list-client";

export default async function FeedbacksAdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (shouldForcePasswordChange(user)) redirect("/change-password");
  
  // Apenas RH pode ver a gestão de feedbacks
  if (user.role !== "RH") redirect("/dashboard");

  const [sidebarCtx, feedbacks] = await Promise.all([
    getMyVacationSidebarContext(user.id),
    (async () => {
      const feedbackModel = (prisma as any).feedback;
      if (!feedbackModel) return [];
      return feedbackModel.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
    })(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f6f8] dark:bg-[#0f1117] lg:flex-row">
      <AppSidebar
        user={user}
        activeView="admin-feedbacks"
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
            <h1 className="text-2xl font-bold text-[#1a1d23] dark:text-white lg:text-3xl">Gestão de Feedbacks</h1>
            <p className="mt-1 text-base text-[#64748b] dark:text-slate-400 lg:text-lg">
              Visualize, resolva ou exclua os relatos enviados pelos usuários.
            </p>
          </div>

          <div className="max-w-5xl">
            <FeedbackListClient initialFeedbacks={JSON.parse(JSON.stringify(feedbacks))} />
          </div>
        </main>
      </div>
    </div>
  );
}
