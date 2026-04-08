-- CreateTable
CREATE TABLE "SystemEmailLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT,
    "subject" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "userId" INTEGER,

    CONSTRAINT "SystemEmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SystemEmailLog_createdAt_idx" ON "SystemEmailLog"("createdAt");

-- CreateIndex
CREATE INDEX "SystemEmailLog_recipientEmail_idx" ON "SystemEmailLog"("recipientEmail");

-- CreateIndex
CREATE INDEX "SystemEmailLog_type_idx" ON "SystemEmailLog"("type");

-- AddForeignKey
ALTER TABLE "SystemEmailLog" ADD CONSTRAINT "SystemEmailLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
