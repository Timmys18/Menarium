import { NextRequest, NextResponse } from 'next/server';

export const API_VERSION = 'v1';

export type Paging = {
  limit: number;
  offset: number;
};

export function getPaging(req: NextRequest, defaultLimit = 20, maxLimit = 50): Paging {
  const rawLimit = Number(req.nextUrl.searchParams.get('limit'));
  const rawOffset = Number(req.nextUrl.searchParams.get('offset'));
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, maxLimit) : defaultLimit;
  const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0;
  return { limit, offset };
}

export function listResponse<T>(
  items: T[],
  paging: Paging,
  total: number,
  legacy: Record<string, unknown> = {},
) {
  return NextResponse.json({
    items,
    hasMore: paging.offset + items.length < total,
    limit: paging.limit,
    offset: paging.offset,
    ...legacy,
  });
}

export function actionResponse<T extends Record<string, unknown>>(
  data: T,
  legacy: Record<string, unknown> = {},
  status = 200,
) {
  return NextResponse.json({
    ok: true,
    data,
    ...legacy,
  }, { status });
}

export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}
