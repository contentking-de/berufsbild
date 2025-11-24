-- AlterTable
ALTER TABLE "batch_job" ADD COLUMN     "errorLogs" JSONB DEFAULT '[]';
