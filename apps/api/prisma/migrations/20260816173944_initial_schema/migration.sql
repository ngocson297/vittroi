-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "pregnancy_status" AS ENUM ('ACTIVE', 'COMPLETED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "status" "user_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mother_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "full_name" VARCHAR(200) NOT NULL,
    "date_of_birth" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "mother_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pregnancies" (
    "id" UUID NOT NULL,
    "mother_profile_id" UUID NOT NULL,
    "due_date" DATE NOT NULL,
    "status" "pregnancy_status" NOT NULL DEFAULT 'ACTIVE',
    "actual_birth_date" DATE,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "pregnancies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "mother_profiles_user_id_key" ON "mother_profiles"("user_id");

-- CreateIndex
CREATE INDEX "pregnancies_mother_profile_id_idx" ON "pregnancies"("mother_profile_id");

-- CreateIndex
CREATE INDEX "pregnancies_status_idx" ON "pregnancies"("status");

-- CreateIndex
CREATE INDEX "pregnancies_due_date_idx" ON "pregnancies"("due_date");

-- AddForeignKey
ALTER TABLE "mother_profiles" ADD CONSTRAINT "mother_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pregnancies" ADD CONSTRAINT "pregnancies_mother_profile_id_fkey" FOREIGN KEY ("mother_profile_id") REFERENCES "mother_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
