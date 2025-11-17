import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { UTApi } from 'uploadthing/server';

const utapi = new UTApi({
  token: process.env.UPLOADTHING_TOKEN,
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (4MB max)
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 4MB)' }, { status: 400 });
    }

    // Upload to Uploadthing
    const response = await utapi.uploadFiles(file);

    if (!response.data) {
      throw new Error('Upload failed');
    }

    return NextResponse.json({
      url: response.data.url,
      key: response.data.key,
      name: response.data.name,
      size: response.data.size,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

