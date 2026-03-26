DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Notification'
      AND column_name = 'text'
  ) THEN
    EXECUTE format(
      'ALTER TABLE %I.%I ALTER COLUMN %I SET DEFAULT %L',
      'public',
      'Notification',
      'text',
      ''
    );

    EXECUTE format(
      'UPDATE %I.%I SET %I = COALESCE(%I, %I, %L) WHERE %I IS NULL',
      'public',
      'Notification',
      'text',
      'text',
      'message',
      '',
      'text'
    );
  END IF;
END $$;