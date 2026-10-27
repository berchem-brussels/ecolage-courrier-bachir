/**
 * Seul point d'accès de l'interface à l'API (standard v3.2, section 6.2).
 * Session par cookie HttpOnly SameSite=Strict posé par le serveur : aucun jeton en localStorage ni dans une URL.
 * Toute écriture porte X-CSRF-Token, jeton propre à la session rendu par la connexion et par /api/auth/me ; il reste en mémoire.
 * Réponses à l'enveloppe { data, meta, pagination } reconnue par meta.envelope === 1.
 */
let csrfToken: string | null = null;
export function setCsrfToken(t: string | null | undefined) { csrfToken = t || null; }
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: string[]) {
    super(message);
  }
}

export interface Page<T> { data: T[]; pagination: { total: number; limit: number; offset: number } }

async function request<T>(method: string, path: string, body?: unknown): Promise<{ data: T; pagination?: Page<T>['pagination'] }> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (method !== 'GET' && csrfToken) headers['X-CSRF-Token'] = csrfToken;
  // Un FormData part en multipart/form-data : le navigateur pose lui-même l'en-tête et sa frontière.
  const multipart = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !multipart) headers['Content-Type'] = 'application/json';
  const payload = body === undefined ? undefined : multipart ? (body as FormData) : JSON.stringify(body);
  const res = await fetch(`/api${path}`, { method, headers, credentials: 'same-origin', body: payload });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json || json.error) {
    if (res.status === 401 && path !== '/auth/login' && path !== '/auth/me') window.dispatchEvent(new Event('app-unauthorized'));
    throw new ApiError(res.status, json?.code || 'INTERNAL', json?.message || res.statusText, json?.details);
  }
  if (json.meta?.envelope !== 1) throw new ApiError(res.status, 'INTERNAL', 'Réponse hors enveloppe');
  if (json.data && typeof json.data === 'object' && 'csrf_token' in json.data) setCsrfToken(json.data.csrf_token);
  return json;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path).then((r) => r.data),
  page: <T>(path: string) => request<T[]>('GET', path).then((r) => ({ data: r.data, pagination: r.pagination! })),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body).then((r) => r.data),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body).then((r) => r.data),
  del: <T>(path: string, body?: unknown) => request<T>('DELETE', path, body ?? {}).then((r) => r.data),
  /** Dépôt d'un fichier (champ « file ») avec des champs texte, en multipart/form-data. */
  upload: <T>(path: string, file: Blob, name: string, fields: Record<string, string | number> = {}) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) fd.append(k, String(v));
    fd.append('file', file, name);
    return request<T>('POST', path, fd).then((r) => r.data);
  },
};

/**
 * Adresse du contenu d'une pièce, ouverte par l'aperçu (cadre ou image) et par le bouton « Ouvrir » : le navigateur
 * l'appelle avec le cookie de session (standard v3.2, section 8.3). Aucun jeton dans l'adresse.
 */
export function pieceUrl(id: number, download = false) {
  return `/api/pieces/${id}/contenu${download ? '?telecharger=1' : ''}`;
}

export function qs(params: Record<string, string | number | undefined>) {
  const p = Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)]);
  return p.length ? `?${new URLSearchParams(p).toString()}` : '';
}

export default api;
