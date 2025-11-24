-- CreateTable
CREATE TABLE "batch_job" (
    "id" TEXT NOT NULL DEFAULT 'batch-job',
    "running" BOOLEAN NOT NULL DEFAULT false,
    "processed" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "current" TEXT,
    "startedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batch_job_pkey" PRIMARY KEY ("id")
);
