-- PostgreSQL: add columns (replaces SQLite PRAGMA / table rebuild from Prisma SQLite)
ALTER TABLE "Item" ADD COLUMN "additionalItemIds" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "Item" ADD COLUMN "extraOfferText" TEXT;
