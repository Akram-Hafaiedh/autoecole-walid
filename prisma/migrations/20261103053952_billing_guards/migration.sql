-- Safety checks and row level security for the billing tables.
-- Safe to run whether or not they already exist.
ALTER TABLE "rates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "student_rates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "discounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "student_discounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rates" DROP CONSTRAINT IF EXISTS "rates_amount_check";
ALTER TABLE "rates" ADD CONSTRAINT "rates_amount_check" CHECK ("amount" >= 0);
ALTER TABLE "rates" DROP CONSTRAINT IF EXISTS "rates_absence_fee_check";
ALTER TABLE "rates" ADD CONSTRAINT "rates_absence_fee_check" CHECK ("absence_fee" >= 0);
ALTER TABLE "student_rates" DROP CONSTRAINT IF EXISTS "student_rates_amount_check";
ALTER TABLE "student_rates" ADD CONSTRAINT "student_rates_amount_check" CHECK ("amount" >= 0);
ALTER TABLE "discounts" DROP CONSTRAINT IF EXISTS "discounts_value_check";
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_value_check" CHECK ("value" > 0 AND ("kind" <> 'percent' OR "value" <= 100));
ALTER TABLE "discounts" DROP CONSTRAINT IF EXISTS "discounts_window_check";
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_window_check" CHECK ("valid_from" IS NULL OR "valid_to" IS NULL OR "valid_to" >= "valid_from");
ALTER TABLE "student_discounts" DROP CONSTRAINT IF EXISTS "student_discounts_value_check";
ALTER TABLE "student_discounts" ADD CONSTRAINT "student_discounts_value_check" CHECK ("value" > 0 AND ("kind" <> 'percent' OR "value" <= 100));
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_amount_check";
ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_check" CHECK ("amount" > 0);
ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "students_package_total_check";
ALTER TABLE "students" ADD CONSTRAINT "students_package_total_check" CHECK ("package_total" IS NULL OR "package_total" >= 0);
ALTER TABLE "lessons" DROP CONSTRAINT IF EXISTS "lessons_custom_price_check";
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_custom_price_check"
    CHECK (("custom_price_mode" IS NULL) = ("custom_price" IS NULL) AND ("custom_price" IS NULL OR "custom_price" >= 0));
ALTER TABLE "lessons" DROP CONSTRAINT IF EXISTS "lessons_amount_check";
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_amount_check" CHECK ("amount" IS NULL OR "amount" >= 0);
