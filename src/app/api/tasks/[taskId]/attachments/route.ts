import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { taskAttachments, tasks } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { unauthorized, notFound, badRequest } from "@/lib/api-helpers";
import { createAttachmentSchema } from "@/lib/validation";
import { canAccessList } from "@/lib/lists";
import { withLogging } from "@/lib/api-logging";

function getAccessibleTask(taskId: string, userId: string) {
  const [task] = db.select({ id: tasks.id, listId: tasks.listId }).from(tasks).where(eq(tasks.id, taskId)).all();
  if (!task) return null;
  if (!canAccessList(userId, task.listId)) return null;
  return task;
}

export const POST = withLogging(
  "tasks/:taskId/attachments",
  async (req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) => {
    const userId = await requireUserId();
    if (!userId) return unauthorized();
    const { taskId } = await params;

    const task = getAccessibleTask(taskId, userId);
    if (!task) return notFound();

    const parsed = createAttachmentSchema.safeParse(await req.json());
    if (!parsed.success) return badRequest(parsed.error.message);

    const mimeMatch = /^data:(image\/[a-zA-Z0-9.+-]+);base64,/.exec(parsed.data.dataUrl);
    if (!mimeMatch) return badRequest("Invalid dataUrl");

    const id = crypto.randomUUID();
    db.insert(taskAttachments)
      .values({
        id,
        taskId,
        userId,
        filename: parsed.data.filename ?? null,
        mimeType: mimeMatch[1],
        dataUrl: parsed.data.dataUrl,
        createdAt: new Date(),
      })
      .run();

    const [row] = db.select().from(taskAttachments).where(eq(taskAttachments.id, id)).all();
    return NextResponse.json(row, { status: 201 });
  }
);
