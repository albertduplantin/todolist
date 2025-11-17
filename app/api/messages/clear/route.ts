import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messages, roomMembers } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

// DELETE all messages in a room for the current user
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { roomId } = body;

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

    // Soft delete all messages from this user in this room
    await db
      .update(messages)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(messages.roomId, roomId),
          eq(messages.senderId, userId),
          isNull(messages.deletedAt)
        )
      );

    // Trigger Pusher event
    await pusher.trigger(`room-${roomId}`, 'messages-cleared', {
      userId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing messages:', error);
    return NextResponse.json(
      { error: 'Failed to clear messages' },
      { status: 500 }
    );
  }
}

