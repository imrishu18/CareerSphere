import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

export const checkUser = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  const email = user.emailAddresses?.[0]?.emailAddress;
  if (!email) {
    return null;
  }

  try {
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ");

    const existingByClerkId = await db.user.findUnique({
      where: { clerkUserId: user.id },
    });

    if (existingByClerkId) {
      const emailOwner = await db.user.findUnique({
        where: { email },
      });
      const canUpdateEmail = !emailOwner || emailOwner.id === existingByClerkId.id;

      return db.user.update({
        where: { id: existingByClerkId.id },
        data: {
          ...(canUpdateEmail ? { email } : {}),
          name: name || existingByClerkId.name,
          imageUrl: user.imageUrl,
        },
      });
    }

    const existingByEmail = await db.user.findUnique({
      where: { email },
    });

    if (existingByEmail) {
      if (existingByEmail.clerkUserId !== user.id) {
        await db.resume.deleteMany({ where: { userId: existingByEmail.id } });
        await db.assessment.deleteMany({ where: { userId: existingByEmail.id } });
        await db.coverLetter.deleteMany({ where: { userId: existingByEmail.id } });
      }

      return db.user.update({
        where: { id: existingByEmail.id },
        data: {
          clerkUserId: user.id,
          name: name || existingByEmail.name,
          imageUrl: user.imageUrl,
          industry: null,
          bio: null,
          experience: null,
          skills: [],
        },
      });
    }

    return db.user.create({
      data: {
        clerkUserId: user.id,
        name,
        imageUrl: user.imageUrl,
        email,
      },
    });
  } catch {
    return null;
  }
};

export const getUserIntegrityDiagnostics = async () => {
  const users = await db.user.findMany({
    select: {
      id: true,
      clerkUserId: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const emailCounts = users.reduce((acc, user) => {
    acc[user.email] = (acc[user.email] || 0) + 1;
    return acc;
  }, {});

  return {
    totalUsers: users.length,
    duplicateEmails: Object.entries(emailCounts)
      .filter(([, count]) => count > 1)
      .map(([email, count]) => ({ email, count })),
    missingClerkId: users.filter((user) => !user.clerkUserId),
  };
};
