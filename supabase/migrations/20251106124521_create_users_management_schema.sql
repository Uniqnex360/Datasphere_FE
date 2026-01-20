CREATE TABLE IF NOT EXISTS pim_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text DEFAULT '',
  role_id uuid,
  associated_industry text DEFAULT '',
  associated_vendor text DEFAULT '',
  associated_brand text DEFAULT '',
  status text DEFAULT 'active',
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text UNIQUE NOT NULL,
  role_description text DEFAULT '',
  is_super_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  module_name text NOT NULL,
  can_view boolean DEFAULT false,
  can_edit boolean DEFAULT false,
  can_create boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  can_bulk_actions boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(role_id, module_name)
);

CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES pim_users(id) ON DELETE SET NULL,
  user_name text NOT NULL,
  action_type text NOT NULL,
  module_name text NOT NULL,
  entity_reference text DEFAULT '',
  details jsonb DEFAULT '{}'::jsonb,
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_role' AND table_name = 'pim_users'
  ) THEN
    ALTER TABLE pim_users ADD CONSTRAINT fk_role
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE pim_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pim_users' AND policyname = 'Allow authenticated users to view users') THEN
    CREATE POLICY IF NOT EXISTS "Allow authenticated users to view users"
      ON pim_users FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pim_users' AND policyname = 'Allow authenticated users to insert users') THEN
    CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert users"
      ON pim_users FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pim_users' AND policyname = 'Allow authenticated users to update users') THEN
    CREATE POLICY IF NOT EXISTS "Allow authenticated users to update users"
      ON pim_users FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pim_users' AND policyname = 'Allow authenticated users to delete users') THEN
    CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete users"
      ON pim_users FOR DELETE
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'roles' AND policyname = 'Allow authenticated users to view roles') THEN
    CREATE POLICY IF NOT EXISTS "Allow authenticated users to view roles"
      ON roles FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'roles' AND policyname = 'Allow authenticated users to insert roles') THEN
    CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert roles"
      ON roles FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'roles' AND policyname = 'Allow authenticated users to update roles') THEN
    CREATE POLICY IF NOT EXISTS "Allow authenticated users to update roles"
      ON roles FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'roles' AND policyname = 'Allow authenticated users to delete roles') THEN
    CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete roles"
      ON roles FOR DELETE
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'permissions' AND policyname = 'Allow authenticated users to view permissions') THEN
    CREATE POLICY IF NOT EXISTS "Allow authenticated users to view permissions"
      ON permissions FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'permissions' AND policyname = 'Allow authenticated users to insert permissions') THEN
    CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert permissions"
      ON permissions FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'permissions' AND policyname = 'Allow authenticated users to update permissions') THEN
    CREATE POLICY IF NOT EXISTS "Allow authenticated users to update permissions"
      ON permissions FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'permissions' AND policyname = 'Allow authenticated users to delete permissions') THEN
    CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete permissions"
      ON permissions FOR DELETE
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_log' AND policyname = 'Allow authenticated users to view activity log') THEN
    CREATE POLICY IF NOT EXISTS "Allow authenticated users to view activity log"
      ON activity_log FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_log' AND policyname = 'Allow authenticated users to insert activity log') THEN
    CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert activity log"
      ON activity_log FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pim_users_email ON pim_users(email);
CREATE INDEX IF NOT EXISTS idx_pim_users_role_id ON pim_users(role_id);
CREATE INDEX IF NOT EXISTS idx_pim_users_status ON pim_users(status);
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(role_name);
CREATE INDEX IF NOT EXISTS idx_permissions_role_id ON permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_timestamp ON activity_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_module ON activity_log(module_name);

DO $$
DECLARE
  super_admin_role_id uuid;
  admin_role_id uuid;
  editor_role_id uuid;
  viewer_role_id uuid;
BEGIN
  INSERT INTO roles (role_name, role_description, is_super_admin)
  VALUES
    ('Super Admin', 'Full system access with role and permission management', true),
    ('Admin', 'Full access to all modules except user management', false),
    ('Editor', 'Can create and edit content in assigned modules', false),
    ('Viewer', 'Read-only access to assigned modules', false)
  ON CONFLICT (role_name) DO NOTHING;

  SELECT id INTO super_admin_role_id FROM roles WHERE role_name = 'Super Admin';
  SELECT id INTO admin_role_id FROM roles WHERE role_name = 'Admin';
  SELECT id INTO editor_role_id FROM roles WHERE role_name = 'Editor';
  SELECT id INTO viewer_role_id FROM roles WHERE role_name = 'Viewer';

  INSERT INTO permissions (role_id, module_name, can_view, can_edit, can_create, can_delete, can_bulk_actions)
  VALUES
    (super_admin_role_id, 'vendors', true, true, true, true, true),
    (super_admin_role_id, 'brands', true, true, true, true, true),
    (super_admin_role_id, 'categories', true, true, true, true, true),
    (super_admin_role_id, 'attributes', true, true, true, true, true),
    (super_admin_role_id, 'products', true, true, true, true, true),
    (super_admin_role_id, 'enrichment', true, true, true, true, true),
    (super_admin_role_id, 'channels', true, true, true, true, true),
    (super_admin_role_id, 'assets', true, true, true, true, true),
    (super_admin_role_id, 'users', true, true, true, true, true),

    (admin_role_id, 'vendors', true, true, true, true, true),
    (admin_role_id, 'brands', true, true, true, true, true),
    (admin_role_id, 'categories', true, true, true, true, true),
    (admin_role_id, 'attributes', true, true, true, true, true),
    (admin_role_id, 'products', true, true, true, true, true),
    (admin_role_id, 'enrichment', true, true, true, true, true),
    (admin_role_id, 'channels', true, true, true, true, true),
    (admin_role_id, 'assets', true, true, true, true, true),
    (admin_role_id, 'users', true, false, false, false, false),

    (editor_role_id, 'vendors', true, true, true, false, false),
    (editor_role_id, 'brands', true, true, true, false, false),
    (editor_role_id, 'categories', true, true, true, false, false),
    (editor_role_id, 'attributes', true, true, true, false, false),
    (editor_role_id, 'products', true, true, true, false, true),
    (editor_role_id, 'enrichment', true, true, true, false, true),
    (editor_role_id, 'channels', true, true, true, false, false),
    (editor_role_id, 'assets', true, true, true, false, false),
    (editor_role_id, 'users', true, false, false, false, false),

    (viewer_role_id, 'vendors', true, false, false, false, false),
    (viewer_role_id, 'brands', true, false, false, false, false),
    (viewer_role_id, 'categories', true, false, false, false, false),
    (viewer_role_id, 'attributes', true, false, false, false, false),
    (viewer_role_id, 'products', true, false, false, false, false),
    (viewer_role_id, 'enrichment', true, false, false, false, false),
    (viewer_role_id, 'channels', true, false, false, false, false),
    (viewer_role_id, 'assets', true, false, false, false, false),
    (viewer_role_id, 'users', true, false, false, false, false)
  ON CONFLICT (role_id, module_name) DO NOTHING;
END $$;