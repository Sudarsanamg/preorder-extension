/*
  Warnings:

  - You are about to drop the `EmailConfig` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EmailSettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GeneralSettings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "EmailConfig";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "EmailSettings";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "GeneralSettings";
PRAGMA foreign_keys=on;
