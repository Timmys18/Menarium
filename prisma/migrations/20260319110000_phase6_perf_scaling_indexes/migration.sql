-- Phase 6: performance indexes
CREATE INDEX IF NOT EXISTS "Item_status_idx" ON "Item"("status");
CREATE INDEX IF NOT EXISTS "Item_userId_idx" ON "Item"("userId");
CREATE INDEX IF NOT EXISTS "Item_createdAt_idx" ON "Item"("createdAt");

CREATE INDEX IF NOT EXISTS "SwapRequest_senderId_idx" ON "SwapRequest"("senderId");
CREATE INDEX IF NOT EXISTS "SwapRequest_receiverId_idx" ON "SwapRequest"("receiverId");
CREATE INDEX IF NOT EXISTS "SwapRequest_status_idx" ON "SwapRequest"("status");
CREATE INDEX IF NOT EXISTS "SwapRequest_receiverItemId_idx" ON "SwapRequest"("receiverItemId");

CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_isRead_idx" ON "Notification"("isRead");
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt");

CREATE INDEX IF NOT EXISTS "Message_swapRequestId_idx" ON "Message"("swapRequestId");
CREATE INDEX IF NOT EXISTS "Message_createdAt_idx" ON "Message"("createdAt");

CREATE INDEX IF NOT EXISTS "ItemMessage_threadId_idx" ON "ItemMessage"("threadId");
CREATE INDEX IF NOT EXISTS "ItemMessage_createdAt_idx" ON "ItemMessage"("createdAt");

