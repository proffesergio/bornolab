/** Server-only: session guards for member routes, member APIs and server actions. */
import { cookies } from "next/headers";
import { USER_COOKIE, sessionUser, type MemberUser } from "./users";

export async function requireMember(): Promise<MemberUser | null> {
  const jar = await cookies();
  const token = jar.get(USER_COOKIE)?.value ?? "";
  if (!token) return null;
  return sessionUser(token);
}

export async function requireMemberOrThrow(): Promise<MemberUser> {
  const user = await requireMember();
  if (!user) {
    const err = new Error("Unauthorized — login required.") as Error & { status?: number };
    err.status = 401;
    throw err;
  }
  return user;
}
