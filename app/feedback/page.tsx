import { redirect } from "next/navigation";
import { getSessionUser, shouldForcePasswordChange } from "@/lib/auth";
import { AppSidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { getMyVacationSidebarContext } from "@/services/dashboardDataService";
import { findUserWithFeedbackInfo } from "@/repositories/userRepository";
import { FeedbackForm } from "./feedback-form";

export default async function FeedbackPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (shouldForcePasswordChange(user)) redirect("/change-password");

  const [sidebarCtx, me] = await Promise.all([
    getMyVacationSidebarContext(user.id),
    findUserWithFeedbackInfo(user.id),
  ]);

  if (!me) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f6f8] dark:bg-[#0f1117] lg:flex-row">
      <AppSidebar
        user={user}
        activeView="feedback"
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
            <h1 className="text-2xl font-bold text-[#1a1d23] dark:text-white lg:text-3xl">Feedback / Sugestão</h1>
            <p className="mt-1 text-base text-[#64748b] dark:text-slate-400 lg:text-lg">
              Sua opinião é fundamental para melhorarmos a ferramenta.
            </p>
          </div>

          <div className="max-w-2xl">
            <FeedbackForm />
          </div>
        </main>
      </div>
    </div>
  );
}
