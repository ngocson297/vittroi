-- PostgreSQL partial uniqueness preserves completed pregnancy history while
-- preventing concurrent requests from creating two ACTIVE pregnancies for one
-- mother profile. Prisma's partialIndexes preview feature mirrors this index in
-- schema.prisma.
CREATE UNIQUE INDEX "pregnancies_one_active_per_mother_profile"
ON "pregnancies"("mother_profile_id")
WHERE "status" = 'ACTIVE';
