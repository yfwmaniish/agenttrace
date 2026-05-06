-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "public_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trace_records" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "sequence_number" INTEGER NOT NULL,
    "span_data" JSONB NOT NULL,
    "content_hash" TEXT NOT NULL,
    "previous_hash" TEXT NOT NULL,
    "chain_hash" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "public_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trace_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merkle_roots" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "root" TEXT NOT NULL,
    "leaf_count" INTEGER NOT NULL,
    "first_sequence" INTEGER NOT NULL,
    "last_sequence" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anchored_to" TEXT,

    CONSTRAINT "merkle_roots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_key" ON "api_keys"("key");

-- CreateIndex
CREATE INDEX "trace_records_session_id_idx" ON "trace_records"("session_id");

-- CreateIndex
CREATE INDEX "trace_records_chain_hash_idx" ON "trace_records"("chain_hash");

-- CreateIndex
CREATE UNIQUE INDEX "trace_records_session_id_sequence_number_key" ON "trace_records"("session_id", "sequence_number");

-- CreateIndex
CREATE INDEX "merkle_roots_session_id_idx" ON "merkle_roots"("session_id");

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trace_records" ADD CONSTRAINT "trace_records_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merkle_roots" ADD CONSTRAINT "merkle_roots_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
