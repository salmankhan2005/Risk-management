import { ApiError, ApiSuccess } from '@/packages/contracts/src';

export class ApiRequestError extends Error {
  public readonly code: string;
  public readonly fieldErrors?: Record<string, string[]>;
  public readonly requestId: string;
  public readonly status: number;

  constructor(status: number, errorPayload: ApiError['error']) {
    super(errorPayload.message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = errorPayload.code;
    this.fieldErrors = errorPayload.fieldErrors;
    this.requestId = errorPayload.requestId;
  }
}

export type TokenProvider = () => Promise<string | null>;

export class ApiClient {
  private baseUrl: string;
  private getToken: TokenProvider;

  constructor(baseUrl: string = '/api/v1', getToken: TokenProvider = async () => null) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.getToken = getToken;
  }

  public setTokenProvider(provider: TokenProvider) {
    this.getToken = provider;
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiSuccess<T>> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const token = await this.getToken();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-request-id': requestId,
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: options.signal || controller.signal,
      });

      const json = await response.json();

      if (!response.ok) {
        const errorData = json as ApiError;
        throw new ApiRequestError(response.status, {
          code: errorData.error?.code || 'UNEXPECTED_ERROR',
          message: errorData.error?.message || `Request failed with status ${response.status}`,
          fieldErrors: errorData.error?.fieldErrors,
          requestId: errorData.error?.requestId || requestId,
        });
      }

      return json as ApiSuccess<T>;
    } catch (err: unknown) {
      if (err instanceof ApiRequestError) {
        throw err;
      }
      const message = err instanceof Error ? err.message : 'Network error or request timeout';
      throw new ApiRequestError(0, {
        code: 'NETWORK_ERROR',
        message,
        requestId,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  public get<T>(endpoint: string, params?: Record<string, unknown>, options?: RequestInit): Promise<ApiSuccess<T>> {
    const query = params ? `?${this.serializeParams(params)}` : '';
    return this.request<T>(`${endpoint}${query}`, { ...options, method: 'GET' });
  }

  public post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<ApiSuccess<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public patch<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<ApiSuccess<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  private serializeParams(params: Record<string, unknown>): string {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    }
    return searchParams.toString();
  }
}

export const api = new ApiClient();

