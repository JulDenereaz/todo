import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { taskAttachments, tasks } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { unauthorized, notFound } from "@/lib/api-helpers";
import { canAccessList } from "@/lib/lists";
import { withLogging } from "@/lib/api-logging";

function getAccessibleAttachment(attachmentId: string, userId: string) {
  const [row] = db
    .select({ attachment: taskAttachments, listId: tasks.listId })
    .from(taskAttachments)
    .innerJoin(tasks, eq(tasks.id, taskAttachments.taskId))
    .where(eq(taskAttachments.id, attachmentId))
    .all();
  if (!row) return null;
  if (!canAccessList(userId, row.listId)) return null;
  return row.attachment;
}

export const DELETE = withLogging(
  "attachments/:attachmentId",
  async (_req: NextRequest, { params }: { params: Promise<{ attachmentId: string }> }) => {
    const userId = await requireUserId();
    if (!userId) return unauthorized();
    const { attachmentId } = await params;

    const existing = getAccessibleAttachment(attachmentId, userId);
    if (!existing) return notFound();

    db.delete(taskAttachments).where(eq(taskAttachments.id, attachmentId)).run();
    return NextResponse.json({ ok: true });
  }
);
