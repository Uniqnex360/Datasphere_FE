export type User = {
  id?: string;
  email: string;
  full_name: string;
  role: "client" | "admin";
  is_active: boolean;
  client_login_url?: string | null;
};
