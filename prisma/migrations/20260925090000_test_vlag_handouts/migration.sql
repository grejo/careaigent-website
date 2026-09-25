-- DropIndex
DROP INDEX "EvaluatieAntwoord_activityId_idx";

-- AlterTable
ALTER TABLE "DeelnemerMail" ADD COLUMN     "bijlageIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "isTest" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "EvaluatieAntwoord" ADD COLUMN     "isTest" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "EvaluatieAntwoord_activityId_isTest_idx" ON "EvaluatieAntwoord"("activityId", "isTest");
