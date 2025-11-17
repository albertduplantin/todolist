import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomId, username } = await req.json();

    if (!roomId || !username) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Trigger typing event
    await pusher.trigger(`room-${roomId}`, 'user-typing', {
      userId,
      username,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error triggering typing event:', error);
    return NextResponse.json(
      { error: 'Failed to trigger typing event' },
      { status: 500 }
    );
  }
}

