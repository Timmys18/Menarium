-- Exchange lifecycle hardening:
-- 1) add bilateral completion flags
-- 2) backfill legacy REJECTED status into DECLINED

ALTER TABLE "SwapRequest"
ADD COLUMN IF NOT EXISTS "senderCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "receiverCompleted" BOOLEAN NOT NULL DEFAULT false;

UPDATE "SwapRequest"
SET "status" = 'DECLINED'
WHERE "status" = 'REJECTED';
