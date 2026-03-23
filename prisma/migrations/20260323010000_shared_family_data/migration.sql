-- Drop old unique index that included userId
DROP INDEX IF EXISTS "MealPlan_weekStart_day_mealType_userId_key";

-- Create new unique index without userId (shared family menu)
CREATE UNIQUE INDEX "MealPlan_weekStart_day_mealType_key" ON "MealPlan"("weekStart", "day", "mealType");
