-- Backfill missing item chat tables (if absent)
CREATE TABLE IF NOT EXISTS "ItemThread" (
  "id" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "buyerUserId" TEXT NOT NULL,
  "sellerUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ItemThread_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ItemThread_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ItemThread_buyerUserId_fkey" FOREIGN KEY ("buyerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ItemThread_sellerUserId_fkey" FOREIGN KEY ("sellerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ItemMessage" (
  "id" TEXT NOT NULL,
  "threadId" TEXT NOT NULL,
  "senderUserId" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ItemMessage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ItemMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ItemThread"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ItemMessage_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "ItemThread_itemId_buyerUserId_key" ON "ItemThread"("itemId", "buyerUserId");
CREATE INDEX IF NOT EXISTS "ItemThread_sellerUserId_createdAt_idx" ON "ItemThread"("sellerUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "ItemThread_buyerUserId_createdAt_idx" ON "ItemThread"("buyerUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "ItemMessage_threadId_createdAt_idx" ON "ItemMessage"("threadId", "createdAt");