import { onboardingSchema, ApiRequestError } from 'api-contracts';
import { authRequest } from './auth-client';
export async function uploadLogo(
  id: string,
  revision: number,
  file: File,
  progress: (value: number) => void,
  signal: AbortSignal,
) {
  const { csrfToken } = await authRequest(
    'auth/csrf',
    'csrf',
    undefined,
    'GET',
    signal,
  );
  const form = new FormData();
  form.set('revision', String(revision));
  form.set('file', file);
  return new Promise<ReturnType<typeof onboardingSchema.parse>>(
    (resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const abort = () => xhr.abort();
      xhr.open('POST', `/api/backend/workspaces/${id}/logo`);
      xhr.setRequestHeader('X-CSRF-Token', csrfToken);
      xhr.timeout = 15000;
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable)
          progress(Math.round((event.loaded / event.total) * 100));
      };
      xhr.onload = () => {
        try {
          if (xhr.status < 200 || xhr.status >= 300)
            throw new ApiRequestError(xhr.status);
          resolve(onboardingSchema.parse(JSON.parse(xhr.responseText)));
        } catch (error) {
          reject(error);
        }
      };
      xhr.onerror =
        xhr.ontimeout =
        xhr.onabort =
          () => reject(new Error('Upload unavailable'));
      xhr.onloadend = () => signal.removeEventListener('abort', abort);
      signal.addEventListener('abort', abort, { once: true });
      if (signal.aborted) {
        reject(new Error('Upload cancelled'));
        return;
      }
      xhr.send(form);
    },
  );
}
