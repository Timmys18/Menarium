/*
  Warnings:

  - Added the required column `additionalItemIds` to the `Item` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "images" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "desiredCategories" TEXT NOT NULL,
    "acceptsAnything" BOOLEAN NOT NULL DEFAULT false,
    "additionalItemIds" TEXT NOT NULL,
    "extraOfferText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Item_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Item" ("acceptsAnything", "category", "city", "createdAt", "description", "desiredCategories", "id", "images", "isOnline", "title", "type", "updatedAt", "userId") SELECT "acceptsAnything", "category", "city", "createdAt", "description", "desiredCategories", "id", "images", "isOnline", "title", "type", "updatedAt", "userId" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
