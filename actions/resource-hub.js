"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { checkUser } from "@/lib/checkUser";

export async function getResourceHubProfile() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized user");

  let user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      name: true,
      industry: true,
      experience: true,
      bio: true,
      skills: true,
    },
  });

  if (!user) {
    const syncedUser = await checkUser();
    user = syncedUser
      ? {
          name: syncedUser.name,
          industry: syncedUser.industry,
          experience: syncedUser.experience,
          bio: syncedUser.bio,
          skills: syncedUser.skills,
        }
      : null;
  }

  if (!user) throw new Error("User not found");

  return user;
}
