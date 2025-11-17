import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { roomMembers, users, rooms } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// POST invite user to room (admin only)
export async function POST(req: Request) {
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

    const body = await req.json();
    const { roomId, userEmail } = body;

    if (!roomId || !userEmail) {
      return NextResponse.json(
        { error: 'Room ID and user email are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const targetUser = await db
      .select()
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1);

    if (!targetUser[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is already a member
    const existingMember = await db
      .select()
      .from(roomMembers)
      .where(
        and(
          eq(roomMembers.roomId, roomId),
          eq(roomMembers.userId, targetUser[0].id)
        )
      )
      .limit(1);

    if (existingMember[0]) {
      return NextResponse.json(
        { error: 'User is already a member' },
        { status: 400 }
      );
    }

    const newMember = await db
      .insert(roomMembers)
      .values({
        roomId,
        userId: targetUser[0].id,
      })
      .returning();

    return NextResponse.json(newMember[0]);
  } catch (error) {
    console.error('Error inviting user:', error);
    return NextResponse.json(
      { error: 'Failed to invite user' },
      { status: 500 }
    );
  }
}

// DELETE remove member from room (admin only)
export async function DELETE(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('id');

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    await db.delete(roomMembers).where(eq(roomMembers.id, memberId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    );
  }
}

// GET members of a room
export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      );
    }

    // Check if user is a member of the room
    const membership = await db
      .select()
      .from(roomMembers)
      .where(
        and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId))
      )
      .limit(1);

    if (!membership[0]) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all members
    const members = await db
      .select({
        id: roomMembers.id,
        userId: users.id,
        username: users.username,
        email: users.email,
        joinedAt: roomMembers.joinedAt,
        isBanned: roomMembers.isBanned,
      })
      .from(roomMembers)
      .innerJoin(users, eq(roomMembers.userId, users.id))
      .where(eq(roomMembers.roomId, roomId));

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

