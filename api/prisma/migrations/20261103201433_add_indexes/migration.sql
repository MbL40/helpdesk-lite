-- AlterTable
ALTER TABLE "business_hours" ALTER COLUMN "start_time" SET DEFAULT '08:00',
ALTER COLUMN "end_time" SET DEFAULT '18:00';

-- CreateIndex
CREATE INDEX "comments_ticket_id_created_at_idx" ON "comments"("ticket_id", "created_at");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "tickets_org_id_idx" ON "tickets"("org_id");

-- CreateIndex
CREATE INDEX "tickets_agent_id_idx" ON "tickets"("agent_id");
