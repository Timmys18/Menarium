-- Add unread flags for swap and item chats
ALTER TABLE "Message"
ADD COLUMN IF NOT EXISTS "isRead" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "ItemMessage"
ADD COLUMN IF NOT EXISTS "isRead" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "Message_swapRequestId_isRead_createdAt_idx"
ON "Message"("swapRequestId", "isRead", "createdAt");

CREATE INDEX IF NOT EXISTS "ItemMessage_threadId_isRead_createdAt_idx"
ON "ItemMessage"("threadId", "isRead", "createdAt");
