import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rooms, roomMembers, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateRoomKey } from '@/lib/encryption';

// GET all rooms for current user
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get rooms where user is a member
    const userRooms = await db
      .select({
        id: rooms.id,
        name: rooms.name,
        description: rooms.description,
        createdAt: rooms.createdAt,
        encryptionKey: rooms.encryptionKey,
        isCreator: rooms.createdById,
      })
      .from(rooms)
      .innerJoin(roomMembers, eq(rooms.id, roomMembers.roomId))
      .where(
        and(
          eq(roomMembers.userId, userId),
          eq(roomMembers.isBanned, false),
          eq(rooms.isActive, true)
        )
      );

    return NextResponse.json(userRooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}

// POST create new room (admin only)
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user exists in DB, if not sync them first
    let user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // If user doesn't exist, we need to sync them from Clerk first
    if (!user[0]) {
      return NextResponse.json(
        { error: 'User not synced. Please refresh the page.' },
        { status: 400 }
      );
    }

    if (!user[0].isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Room name is required' },
        { status: 400 }
      );
    }

    // Generate encryption key for the room
    const encryptionKey = generateRoomKey();

    const newRoom = await db
      .insert(rooms)
      .values({
        name,
        description,
        createdById: userId,
        encryptionKey,
      })
      .returning();

    // Add creator as member
    await db.insert(roomMembers).values({
      roomId: newRoom[0].id,
      userId,
    });

    return NextResponse.json(newRoom[0]);
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
}

// DELETE room (admin only)
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
    const roomId = searchParams.get('id');

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    await db.delete(rooms).where(eq(rooms.id, roomId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json(
      { error: 'Failed to delete room' },
      { status: 500 }
    );
  }
}

