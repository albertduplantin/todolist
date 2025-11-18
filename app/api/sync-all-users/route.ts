import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Sync all Clerk users to database (admin only)
export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user[0] || !user[0].isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    console.log('[Sync All Users] Starting sync...');

    // Get all Clerk users
    const client = await clerkClient();
    const clerkUsers = await client.users.getUserList({ limit: 500 });

    console.log(`[Sync All Users] Found ${clerkUsers.data.length} users in Clerk`);

    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const clerkUser of clerkUsers.data) {
      try {
        const email = clerkUser.emailAddresses[0]?.emailAddress || 'unknown';
        const username = clerkUser.username || email.split('@')[0];

        // Check if user exists
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.id, clerkUser.id))
          .limit(1);

        if (existingUser.length === 0) {
          // Create new user
          await db.insert(users).values({
            id: clerkUser.id,
            email,
            username,
            isAdmin: clerkUser.publicMetadata?.isAdmin === true || false,
          });
          created++;
          console.log(`[Sync All Users] Created user: ${email}`);
        } else {
          // Update existing user
          await db
            .update(users)
            .set({
              email,
              username,
              isAdmin: clerkUser.publicMetadata?.isAdmin === true || existingUser[0].isAdmin,
              updatedAt: new Date(),
            })
            .where(eq(users.id, clerkUser.id));
          updated++;
          console.log(`[Sync All Users] Updated user: ${email}`);
        }
      } catch (error) {
        console.error(`[Sync All Users] Error processing user ${clerkUser.id}:`, error);
        errors++;
      }
    }

    console.log(`[Sync All Users] Sync complete: ${created} created, ${updated} updated, ${errors} errors`);

    return NextResponse.json({
      success: true,
      total: clerkUsers.data.length,
      created,
      updated,
      errors,
    });
  } catch (error) {
    console.error('[Sync All Users] Error:', error);
    return NextResponse.json(
      { error: 'Failed to sync users', details: String(error) },
      { status: 500 }
    );
  }
}

