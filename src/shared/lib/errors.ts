import { AxiosError } from 'axios';

interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  path?: string;
  method?: string;
  timestamp?: string;
}

export function getApiErrorMessage(error: unknown, fallback = 'Une erreur est survenue.'): string {
  if (error instanceof AxiosError) {
    const body = error.response?.data as ApiErrorBody | undefined;
    if (body?.message) {
      return Array.isArray(body.message) ? body.message.join(' ') : body.message;
    }
  }
  return fallback;
}
