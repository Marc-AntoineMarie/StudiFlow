import { getToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  // FormData (upload de fichier) : ne JAMAIS poser Content-Type nous-mêmes, le
  // navigateur doit fixer le boundary multipart lui-même.
  const estFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!estFormData) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = 'Une erreur est survenue.';
    try {
      const body = await res.json();
      message = Array.isArray(body?.message) ? body.message.join(', ') : (body?.message ?? message);
    } catch {
      // corps non JSON, on garde le message générique
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Téléchargement de fichier authentifié : renvoie un Blob (pas de JSON attendu). */
export async function apiDownloadBlob(path: string): Promise<Blob> {
  const token = getToken();
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { headers });
  if (!res.ok) throw new ApiError(res.status, 'Téléchargement impossible.');
  return res.blob();
}
