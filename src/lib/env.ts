// A-05: Central env validation. Malformed values fail the build.
// Secrets and DB credentials live in the Vercel server functions, so they are
// intentionally absent from the client bundle. The client falls back to
// same-origin endpoints (see src/config/payment.ts), so a missing variable is
// not an error and must not spam the browser console.
//
// The validation is hand written on purpose: pulling a schema library into the
// entry chunk added ~100 KB to every page load for nine optional strings.

const URL_LIKE = /^(https?:\/\/|\/)/i;

type EnvKey =
  | 'VITE_SUPABASE_URL'
  | 'VITE_SUPABASE_ANON_KEY'
  | 'VITE_APPWRITE_ENDPOINT'
  | 'VITE_APPWRITE_PROJECT_ID'
  | 'VITE_APPWRITE_DATABASE_ID'
  | 'VITE_APPWRITE_COLLECTION_ID'
  | 'VITE_APPWRITE_FUNCTION_ID'
  | 'VITE_PAYMENT_API_URL'
  | 'VITE_PAYMENT_INIT_URL';

const OPTIONAL_KEYS: EnvKey[] = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_APPWRITE_ENDPOINT',
  'VITE_APPWRITE_PROJECT_ID',
  'VITE_APPWRITE_DATABASE_ID',
  'VITE_APPWRITE_COLLECTION_ID',
  'VITE_APPWRITE_FUNCTION_ID',
  'VITE_PAYMENT_API_URL',
  'VITE_PAYMENT_INIT_URL',
];

const raw = import.meta.env as Record<string, string | undefined>;

const env = {} as Record<EnvKey, string | undefined>;

for (const key of OPTIONAL_KEYS) {
  const value = raw[key];
  if (value === undefined || value === '') {
    env[key] = undefined;
    continue;
  }
  if ((key.endsWith('_URL') || key.endsWith('_ENDPOINT')) && !URL_LIKE.test(value)) {
    throw new Error(`Invalid ${key}: expected an absolute URL`);
  }
  env[key] = value;
}

export { env };

if (import.meta.env.DEV) {
  const missing = OPTIONAL_KEYS.filter((k) => !env[k]);
  if (missing.length) {
    console.info(`[env] Optional client vars not set, using same-origin fallbacks: ${missing.join(', ')}`);
  }
}
