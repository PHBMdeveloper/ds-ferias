-- AlterTable
ALTER TABLE "VacationRequest" ADD COLUMN     "acquisitionPeriodId" TEXT;

-- AddForeignKey
ALTER TABLE "VacationRequest" ADD CONSTRAINT "VacationRequest_acquisitionPeriodId_fkey" FOREIGN KEY ("acquisitionPeriodId") REFERENCES "AcquisitionPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
