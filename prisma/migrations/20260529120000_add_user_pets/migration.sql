CREATE TABLE "Pet" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "breed" TEXT,
    "sex" TEXT NOT NULL,
    "birthday" TIMESTAMP(3),
    "age" TEXT,
    "neutered" BOOLEAN NOT NULL DEFAULT false,
    "weightKg" DOUBLE PRECISION,
    "photoUrl" TEXT,
    "vaccineStatus" TEXT,
    "allergyHistory" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pet_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Pet_ownerId_idx" ON "Pet"("ownerId");

ALTER TABLE "Pet" ADD CONSTRAINT "Pet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
