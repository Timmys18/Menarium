-- Phase 3: Notifications + Item chat schema migration

-- ШАГ 1 — добавить новые поля как nullable
ALTER TABLE "Notification"
  ADD COLUMN IF NOT EXISTS "title" TEXT,
  ADD COLUMN IF NOT EXISTS "message" TEXT,
  ADD COLUMN IF NOT EXISTS "href" TEXT,
  ADD COLUMN IF NOT EXISTS "entityType" TEXT,
  ADD COLUMN IF NOT EXISTS "entityId" TEXT;

-- ШАГ 2 — backfill старых записей
UPDATE "Notification"
SET "title" = COALESCE("title", 'Уведомление'),
    "message" = COALESCE("message", 'Событие на платформе')
WHERE "title" IS NULL OR "message" IS NULL;

-- ШАГ 3 — сделать их NOT NULL
ALTER TABLE "Notification"
  ALTER COLUMN "title" SET NOT NULL,
  ALTER COLUMN "message" SET NOT NULL;

-- ШАГ 4 — создать enum если не существует
DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM (
    'SWAP_RECEIVED',
    'SWAP_ACCEPTED',
    'SWAP_DECLINED',
    'SWAP_COMPLETED',
    'MESSAGE_RECEIVED',
    'ITEM_MESSAGE_RECEIVED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ШАГ 5 — временно привести старый type к TEXT (на случай старых ограничений)
ALTER TABLE "Notification"
  ALTER COLUMN "type" TYPE TEXT;

-- ШАГ 6 — привести старые значения type к допустимому значению
UPDATE "Notification"
SET "type" = 'SWAP_RECEIVED'
WHERE "type" NOT IN (
  'SWAP_RECEIVED',
  'SWAP_ACCEPTED',
  'SWAP_DECLINED',
  'SWAP_COMPLETED',
  'MESSAGE_RECEIVED',
  'ITEM_MESSAGE_RECEIVED'
);

-- ШАГ 7 — перевести type в enum
ALTER TABLE "Notification"
  ALTER COLUMN "type"
  TYPE "NotificationType"
  USING "type"::"NotificationType";

