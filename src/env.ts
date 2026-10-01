type SecretBindings = {
  HELVOK_ADMIN_TOKEN?: string;
  HELVOK_PLATFORM_ADMIN_USER_IDS?: string;
  STRIPE_SECRET_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  HELVOK_CERT_ENCRYPTION_KEY?: string;
  FOCUS_NFE_TOKEN?: string;
  HELVOK_PEPPOL_AP_KEY?: string;
};

type PublicBindings = {
  SUPABASE_PUBLISHABLE_KEY?: string;
};

export type AppBindings = Cloudflare.Env & PublicBindings & SecretBindings;

export type AppEnv = {
  Bindings: AppBindings;
  Variables: { billingAdminId: string };
};

