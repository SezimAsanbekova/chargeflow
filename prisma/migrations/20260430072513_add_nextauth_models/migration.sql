/*
  Warnings:

  - You are about to drop the column `is_phone_verified` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `users` table. All the data in the column will be lost.
  - Made the column `email` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "users_phone_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "is_phone_verified",
DROP COLUMN "phone",
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "name" SET DATA TYPE VARCHAR(255);
