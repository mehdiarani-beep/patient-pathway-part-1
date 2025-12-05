
INSERT INTO clinic_members (
  clinic_id,
  user_id,
  email,
  first_name,
  last_name,
  role,
  permissions,
  status,
  accepted_at,
  created_at
) VALUES (
  '0a801d88-14b4-4688-92c2-6e648d8d85a0',
  '18565365-f4dd-40a3-a04d-5ccbf1e2c64d',
  'niki@exhalesinus.com',
  'Niki',
  'Blower',
  'manager',
  '{"leads": true, "content": true, "payments": false, "team": false}',
  'active',
  '2025-11-19 13:36:59.551+00',
  NOW()
);
