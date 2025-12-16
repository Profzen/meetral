import { v2 as cloudinary } from 'cloudinary';

// Expect env vars:
// Preferred: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
// Fallback:  CLOUDINARY_URL=cloudinary://<key>:<secret>@<cloud_name>
const { CLOUDINARY_URL, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

if (CLOUDINARY_URL) {
  // Single-URL config supported by Cloudinary; keeps legacy .env working.
  cloudinary.config({ cloudinary_url: CLOUDINARY_URL });
} else {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
}

// POST /api/cloudinary/upload
// Body: { dataUrl: string, folder?: string }
// Returns: { url, public_id }
export async function POST(req) {
  try {
    const body = await req.json();
    const { dataUrl, folder = 'events' } = body || {};
    if (!dataUrl) return new Response(JSON.stringify({ error: 'Missing dataUrl' }), { status: 400 });

    const res = await cloudinary.uploader.upload(dataUrl, { folder, resource_type: 'image' });
    const out = { url: res.secure_url, public_id: res.public_id };
    return new Response(JSON.stringify(out), { status: 201 });
  } catch (err) {
    console.error('Cloudinary upload error', err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), { status: 500 });
  }
}
