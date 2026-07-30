import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { unauthorized } from "@/lib/api-helpers";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const rows = db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .orderBy(asc(users.name), asc(users.email))
    .all();
  return NextResponse.json(rows);
}
