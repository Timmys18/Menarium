-- Add historical acceptance timestamp for SwapRequest
ALTER TABLE "SwapRequest"
ADD COLUMN IF NOT EXISTS "acceptedAt" TIMESTAMP(3);

-- Backfill:
-- 1) ACCEPTED/COMPLETED definitely had acceptance -> use updatedAt, fallback createdAt
UPDATE "SwapRequest"
SET "acceptedAt" = COALESCE("updatedAt", "createdAt")
WHERE "acceptedAt" IS NULL
  AND "status" IN ('ACCEPTED', 'COMPLETED');

-- 2) CANCELLED that likely were accepted before cancel:
-- use sender/receiver completion flags as reliable evidence
UPDATE "SwapRequest"
SET "acceptedAt" = COALESCE("updatedAt", "createdAt")
WHERE "acceptedAt" IS NULL
  AND "status" = 'CANCELLED'
  AND ("senderCompleted" = true OR "receiverCompleted" = true);
