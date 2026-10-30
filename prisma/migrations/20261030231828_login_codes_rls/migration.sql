-- Same rule as the other tables (see prisma/constraints.sql): no policies, so a
-- public (anon) key reads nothing. The app reaches this table through the server only.
ALTER TABLE "login_codes" ENABLE ROW LEVEL SECURITY;
