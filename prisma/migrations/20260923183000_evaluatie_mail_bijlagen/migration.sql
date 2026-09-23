-- CreateEnum
CREATE TYPE "BijlageSoort" AS ENUM ('BESTAND', 'LINK');

-- CreateEnum
CREATE TYPE "MailSoort" AS ENUM ('INSCHRIJVING_BEVESTIGING', 'INSCHRIJVING_MELDING_ADMIN', 'EVALUATIE_MELDING_ADMIN', 'DEELNEMER_EVALUATIE_UITNODIGING');

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "evaluatieOpen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "evaluatieOpenLink" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isHidden" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "EvaluatieAntwoord" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "formVersie" TEXT NOT NULL,
    "antwoorden" JSONB NOT NULL,
    "kennisScore" INTEGER,
    "c1Opvolging" BOOLEAN NOT NULL,

    CONSTRAINT "EvaluatieAntwoord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpvolgContact" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "aangemaaktOp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uitnodigingVerstuurdOp" TIMESTAMP(3),
    "ingevuldOp" TIMESTAMP(3),
    "verwijderOp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpvolgContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluatieExportLog" (
    "id" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "activityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaluatieExportLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiviteitBijlage" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "soort" "BijlageSoort" NOT NULL,
    "titel" TEXT NOT NULL,
    "bestandsnaam" TEXT,
    "mimeType" TEXT,
    "grootte" INTEGER,
    "data" BYTEA,
    "url" TEXT,
    "downloadsTotaal" INTEGER NOT NULL DEFAULT 0,
    "uniekeDownloaders" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActiviteitBijlage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeelnemerMail" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "naam" TEXT,
    "bron" TEXT NOT NULL,
    "evalTokenHash" TEXT,
    "downloadToken" TEXT NOT NULL,
    "laatstVerstuurdOp" TIMESTAMP(3),
    "aantalVerstuurd" INTEGER NOT NULL DEFAULT 0,
    "evaluatieIngevuld" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeelnemerMail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BijlageDownload" (
    "id" TEXT NOT NULL,
    "bijlageId" TEXT NOT NULL,
    "deelnemerMailId" TEXT NOT NULL,
    "aantal" INTEGER NOT NULL DEFAULT 1,
    "eersteDownloadOp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "laatsteDownloadOp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BijlageDownload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailInstelling" (
    "soort" "MailSoort" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "ontvangerEmail" TEXT,
    "replyToEmail" TEXT,
    "subject" TEXT,
    "intro" TEXT,
    "footerNote" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MailInstelling_pkey" PRIMARY KEY ("soort")
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "powerAutomateWebhookUrl" TEXT,
    "replyToEmail" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EvaluatieAntwoord_activityId_idx" ON "EvaluatieAntwoord"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "OpvolgContact_token_key" ON "OpvolgContact"("token");

-- CreateIndex
CREATE UNIQUE INDEX "OpvolgContact_activityId_email_key" ON "OpvolgContact"("activityId", "email");

-- CreateIndex
CREATE INDEX "ActiviteitBijlage_activityId_idx" ON "ActiviteitBijlage"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "DeelnemerMail_evalTokenHash_key" ON "DeelnemerMail"("evalTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "DeelnemerMail_downloadToken_key" ON "DeelnemerMail"("downloadToken");

-- CreateIndex
CREATE UNIQUE INDEX "DeelnemerMail_activityId_email_key" ON "DeelnemerMail"("activityId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "BijlageDownload_bijlageId_deelnemerMailId_key" ON "BijlageDownload"("bijlageId", "deelnemerMailId");

-- AddForeignKey
ALTER TABLE "EvaluatieAntwoord" ADD CONSTRAINT "EvaluatieAntwoord_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiviteitBijlage" ADD CONSTRAINT "ActiviteitBijlage_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeelnemerMail" ADD CONSTRAINT "DeelnemerMail_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BijlageDownload" ADD CONSTRAINT "BijlageDownload_bijlageId_fkey" FOREIGN KEY ("bijlageId") REFERENCES "ActiviteitBijlage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BijlageDownload" ADD CONSTRAINT "BijlageDownload_deelnemerMailId_fkey" FOREIGN KEY ("deelnemerMailId") REFERENCES "DeelnemerMail"("id") ON DELETE CASCADE ON UPDATE CASCADE;
