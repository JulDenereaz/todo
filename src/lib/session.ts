import { auth } from "@/auth";
import { logger } from "@/lib/logger";

export async function requireUserId(): Promise<string | null> {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  if (userId) {
    logger.debug({ userId }, "session resolved");
  } else {
    logger.debug("no session");
  }
  return userId;
}
