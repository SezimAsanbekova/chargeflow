-- AlterTable
ALTER TABLE "users" ADD COLUMN     "locked_until" TIMESTAMP(6),
ADD COLUMN     "login_attempts" INTEGER NOT NULL DEFAULT 0;
