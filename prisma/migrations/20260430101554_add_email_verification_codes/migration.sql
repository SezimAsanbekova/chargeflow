-- CreateEnum
CREATE TYPE "CodeType" AS ENUM ('login', 'registration');

-- CreateTable
CREATE TABLE "email_verification_codes" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "code" VARCHAR(6) NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "type" "CodeType" NOT NULL DEFAULT 'login',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_verification_codes_email_code_idx" ON "email_verification_codes"("email", "code");
