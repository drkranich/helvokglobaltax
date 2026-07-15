type SecretBindings = {
  HELVOK_ADMIN_TOKEN?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
};

export type AppBindings = Cloudflare.Env & SecretBindings;

export type AppEnv = {
  Bindings: AppBindings;
};
