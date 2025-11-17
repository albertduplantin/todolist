import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function syncUser() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user data from Clerk
    const email = user.emailAddresses[0]?.emailAddress;
    const username = user.username || user.firstName || email?.split('@')[0] || 'User';
    // Read isAdmin from Clerk publicMetadata
    const isAdmin = user.publicMetadata?.isAdmin === true;

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length > 0) {
      // Update user to sync isAdmin status from Clerk
      const updatedUser = await db
        .update(users)
        .set({
          email: email || '',
          username: username,
          isAdmin: isAdmin,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      return NextResponse.json({ 
        message: 'User updated successfully',
        user: updatedUser[0]
      });
    }

    // Create user in database with isAdmin from Clerk
    const newUser = await db
      .insert(users)
      .values({
        id: userId,
        email: email || '',
        username: username,
        isAdmin: isAdmin,
      })
      .returning();

    return NextResponse.json({ 
      message: 'User synced successfully',
      user: newUser[0]
    });
  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json(
      { error: 'Failed to sync user' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return syncUser();
}

export async function POST() {
  return syncUser();
}

