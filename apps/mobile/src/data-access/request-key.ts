// This identifier deduplicates an application mutation; it is never a credential or public capability.
export const createRequestKey = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (value) => {
    const n = Math.floor(Math.random() * 16);
    return (value === 'x' ? n : (n & 3) | 8).toString(16);
  });
