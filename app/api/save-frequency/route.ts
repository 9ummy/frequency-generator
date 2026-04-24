import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function randomId(len = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: len }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

export async function POST(req: NextRequest) {
  const { imageBase64, title, description, preset } = await req.json();

  // base64 data URL → Buffer
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  const mimeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
  const contentType = mimeMatch?.[1] ?? 'image/jpeg';
  const ext = contentType.split('/')[1];

  const id = randomId();
  const filename = `${id}.${ext}`;

  // 이미지 → Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('frequency-images')
    .upload(filename, buffer, { contentType, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage
    .from('frequency-images')
    .getPublicUrl(filename);

  // 메타데이터 → DB
  const { error: dbError } = await supabase
    .from('frequencies')
    .insert({ id, title, description: description ?? '', preset, image_url: publicUrl });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ id });
}
