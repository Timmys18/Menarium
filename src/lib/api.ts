export type ApiGetSuccess<T> = { ok: true; data: T };
export type ApiGetError = { ok: false; status: number; error: string };

export async function apiGet<T>(url: string): Promise<ApiGetSuccess<T> | ApiGetError> {
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (res.status === 401) {
      return { ok: false, status: 401, error: 'Не авторизовано' };
    }

    if (!res.ok) {
      let message = 'Ошибка запроса';
      try {
        const body = await res.json();
        if (body && typeof body.error === 'string') {
          message = body.error;
        } else if (body && typeof body.message === 'string') {
          message = body.message;
        }
      } catch {
        // ignore parse errors
      }
      return { ok: false, status: res.status, error: message };
    }

    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch {
    return { ok: false, status: 0, error: 'Ошибка запроса' };
  }
}

export async function apiPost<TReq, TRes>(
  url: string,
  body: TReq,
): Promise<ApiGetSuccess<TRes> | ApiGetError> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (res.status === 401) {
      return { ok: false, status: 401, error: 'Не авторизовано' };
    }

    if (!res.ok) {
      let message = 'Ошибка запроса';
      try {
        const responseBody = await res.json();
        if (responseBody && typeof responseBody.error === 'string') {
          message = responseBody.error;
        } else if (responseBody && typeof responseBody.message === 'string') {
          message = responseBody.message;
        }
      } catch {
        // ignore parse errors
      }
      return { ok: false, status: res.status, error: message };
    }

    const data = (await res.json()) as TRes;
    return { ok: true, data };
  } catch {
    return { ok: false, status: 0, error: 'Ошибка запроса' };
  }
}

export async function apiPatch<TReq, TRes>(
  url: string,
  body: TReq,
): Promise<ApiGetSuccess<TRes> | ApiGetError> {
  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (res.status === 401) {
      return { ok: false, status: 401, error: 'Не авторизовано' };
    }

    if (!res.ok) {
      let message = 'Ошибка запроса';
      try {
        const responseBody = await res.json();
        if (responseBody && typeof responseBody.error === 'string') {
          message = responseBody.error;
        } else if (responseBody && typeof responseBody.message === 'string') {
          message = responseBody.message;
        }
      } catch {
        // ignore parse errors
      }
      return { ok: false, status: res.status, error: message };
    }

    const data = (await res.json()) as TRes;
    return { ok: true, data };
  } catch {
    return { ok: false, status: 0, error: 'Ошибка запроса' };
  }
}

