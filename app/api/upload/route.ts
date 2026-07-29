import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const file = data.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const base64File = `data:${file.type};base64,${buffer.toString('base64')}`;
    
    const uploadResponse = await cloudinary.uploader.upload(base64File, {
      resource_type: 'auto',
      folder: 'employee_documents',
    });

    return NextResponse.json({
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id,
      fileType: file.type
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}