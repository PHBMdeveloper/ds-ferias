import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

const getCachedUsers = unstable_cache(
  async () => {
    return prisma.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: { id: true, name: true, email: true, role: true },
    });
  },
  ["login-users-list"],
  { revalidate: 60 }, // revalida a cada 60 segundos
);

export async function GET() {
  const users = await getCachedUsers();
  return NextResponse.json(
    { users },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}

