import { NextRequest, NextResponse } from 'next/server';
import { getUserFromPrivyToken } from '@/lib/auth-utils';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = await getUserFromPrivyToken(token);
    if (!user.isAuthenticated || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    let buffer = Buffer.from(bytes);

    buffer = Buffer.from(await sharp(buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer());

    const pinataJwt = process.env.PINATA_JWT;
    if (!pinataJwt) return NextResponse.json({ error: 'Pinata not configured' }, { status: 500 });

    const FormData = (await import('form-data')).default;
    const pinataFormData = new FormData();
    pinataFormData.append('file', buffer, { filename: file.name, contentType: 'image/jpeg' });

    const axios = (await import('axios')).default;
    const pinataResponse = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      pinataFormData,
      {
        maxBodyLength: Infinity,
        headers: { Authorization: `Bearer ${pinataJwt}`, ...pinataFormData.getHeaders() },
      }
    );

    const cid = pinataResponse.data.IpfsHash;
    const gatewayUrl = process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL || '';
    const gatewayToken = process.env.NEXT_PUBLIC_PINATA_GATEWAY_TOKEN || '';
    const url = `${gatewayUrl}/ipfs/${cid}${gatewayToken ? `?pinataGatewayToken=${gatewayToken}` : ''}`;

    return NextResponse.json({ cid, url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
