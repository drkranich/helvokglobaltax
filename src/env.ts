type SecretBindings = {
  HELVOK_ADMIN_TOKEN?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  HELVOK_CERT_ENCRYPTION_KEY?: string;
};

type PublicBindings = {
  SUPABASE_PUBLISHABLE_KEY?: string;
};

export type AppBindings = Cloudflare.Env & PublicBindings & SecretBindings;

export type AppEnv = {
  Bindings: AppBindings;
};
