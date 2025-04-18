/*
  Warnings:

  - You are about to drop the column `folderName` on the `ArtPiece` table. All the data in the column will be lost.
  - Added the required column `url` to the `ArtPiece` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ArtPiece" DROP COLUMN "folderName",
ADD COLUMN     "url" TEXT NOT NULL;
