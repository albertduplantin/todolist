import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rooms, roomMembers, users } from '@/lib/db/schema';

// DEBUG API - Check database state
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await db
      .select()
      .from(users)
      .where((t) => t.id === userId)
      .limit(1);

    // Get ALL rooms (no filter)
    const allRooms = await db.select().from(rooms);

    // Get ALL room members
    const allMembers = await db.select().from(roomMembers);

    // Get current user info
    const currentUser = user[0] || null;

    return NextResponse.json({
      currentUser: {
        id: userId,
        isAdmin: currentUser?.isAdmin || false,
        email: currentUser?.email || 'unknown',
      },
      totalRooms: allRooms.length,
      rooms: allRooms.map(r => ({
        id: r.id,
        name: r.name,
        createdBy: r.createdById,
        isActive: r.isActive,
      })),
      totalMembers: allMembers.length,
      members: allMembers.map(m => ({
        userId: m.userId,
        roomId: m.roomId,
        isBanned: m.isBanned,
      })),
      membersForCurrentUser: allMembers.filter(m => m.userId === userId),
    });
  } catch (error) {
    console.error('Error in debug API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debug info', details: String(error) },
      { status: 500 }
    );
  }
}

