import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messages, roomMembers } from '@/lib/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

// GET messages for a room
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

    // Get messages - only fetch non-deleted messages
    const roomMessages = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.roomId, roomId),
          isNull(messages.deletedAt)
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(100);

    // Double-check filtering: ensure deletedAt is null or undefined
    const filteredMessages = roomMessages.filter(
      msg => msg.deletedAt === null || msg.deletedAt === undefined
    );

    console.log(`[API] Room ${roomId}: Fetched ${roomMessages.length} messages, filtered to ${filteredMessages.length}`);

    return NextResponse.json(filteredMessages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST send message
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { roomId, encryptedContent, messageType, imageUrl } = body;

    if (!roomId || !encryptedContent) {
      return NextResponse.json(
        { error: 'Room ID and content are required' },
        { status: 400 }
      );
    }

    // Check if user is a member of the room
    const membership = await db
      .select()
      .from(roomMembers)
      .where(
        and(
          eq(roomMembers.roomId, roomId),
          eq(roomMembers.userId, userId),
          eq(roomMembers.isBanned, false)
        )
      )
      .limit(1);

    if (!membership[0]) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const newMessage = await db
      .insert(messages)
      .values({
        roomId,
        senderId: userId,
        encryptedContent,
        messageType: messageType || 'text',
        imageUrl,
      })
      .returning();

    // Trigger Pusher event
    await pusher.trigger(`room-${roomId}`, 'new-message', {
      id: newMessage[0].id,
      roomId: newMessage[0].roomId,
      senderId: newMessage[0].senderId,
      encryptedContent: newMessage[0].encryptedContent,
      messageType: newMessage[0].messageType,
      imageUrl: newMessage[0].imageUrl,
      createdAt: newMessage[0].createdAt,
    });

    return NextResponse.json(newMessage[0]);
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// DELETE message
export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get('id');

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    // Soft delete - set deletedAt timestamp
    const deletedMessage = await db
      .update(messages)
      .set({ deletedAt: new Date() })
      .where(and(eq(messages.id, messageId), eq(messages.senderId, userId)))
      .returning();

    if (deletedMessage.length === 0) {
      console.log(`[API] Failed to delete message ${messageId} - not found or unauthorized`);
      return NextResponse.json(
        { error: 'Message not found or not authorized' },
        { status: 404 }
      );
    }

    console.log(`[API] Message ${messageId} soft-deleted successfully, deletedAt: ${deletedMessage[0].deletedAt}`);

    // Trigger Pusher event
    await pusher.trigger(
      `room-${deletedMessage[0].roomId}`,
      'message-deleted',
      {
        messageId: deletedMessage[0].id,
      }
    );

    console.log(`[API] Pusher event triggered for room ${deletedMessage[0].roomId}`);

    return NextResponse.json({ success: true, deletedAt: deletedMessage[0].deletedAt });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}

