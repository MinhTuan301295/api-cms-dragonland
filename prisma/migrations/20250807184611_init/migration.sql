-- CreateTable
CREATE TABLE "AnalyticsStat" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalUsers" INTEGER NOT NULL,
    "newUsers" INTEGER NOT NULL,
    "activeUsers" INTEGER NOT NULL,
    "returningUsers" INTEGER NOT NULL,
    "sessions" INTEGER NOT NULL,
    "directSessions" INTEGER NOT NULL,
    "referralSessions" INTEGER NOT NULL,
    "avgEngagementTimeSec" INTEGER NOT NULL,
    "totalRevenue" DOUBLE PRECISION NOT NULL,
    "topCountries" JSONB NOT NULL,
    "activeUsersByCountry" JSONB NOT NULL,
    "userRetentionByCohort" JSONB NOT NULL,
    "userRetention" JSONB NOT NULL,
    "eventSummary" JSONB NOT NULL,
    "newUsersByChannel" JSONB NOT NULL,
    "userActivityOverTime" JSONB NOT NULL,
    "retentionPercent" DOUBLE PRECISION NOT NULL,
    "totalPlayTime" INTEGER NOT NULL,
    "oldNewUsers" JSONB NOT NULL,
    "userGender" JSONB NOT NULL,
    "userLanguage" JSONB NOT NULL,
    "platformSummary" JSONB NOT NULL,
    "osSummary" JSONB NOT NULL,
    "browserSummary" JSONB NOT NULL,
    "deviceCategory" JSONB NOT NULL,
    "note" TEXT,

    CONSTRAINT "AnalyticsStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsStat_date_key" ON "AnalyticsStat"("date");
