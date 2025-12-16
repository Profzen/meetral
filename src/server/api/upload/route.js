import { supabaseAdmin } from '@/lib/supabaseAdmin';

// POST /api/upload
// Body: { name: string, dataUrl: string }
// Returns { url }
export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return new Response(JSON.stringify({ error: 'Missing token' }), { status: 401 });

    // validate token
    const { data: authData, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr) throw authErr;
    if (!authData?.user) return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });

    const body = await req.json();
    const { name, dataUrl } = body || {};
    if (!name || !dataUrl) return new Response(JSON.stringify({ error: 'Missing body name or dataUrl' }), { status: 400 });

    // Log upload attempt (non-sensitive data)
    console.log('[API] /api/upload called', { name: name });

    const m = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!m) return new Response(JSON.stringify({ error: 'Invalid dataUrl format' }), { status: 400 });
    const contentType = m[1];
    const b64 = m[2];
    const buffer = Buffer.from(b64, 'base64');
    const bucket = 'events';
    const fileName = `${name}`;
    const path = `${fileName}`;

    const { data, error } = await supabaseAdmin.storage.from(bucket).upload(path, buffer, {
      contentType,
      upsert: false,
    });
    if (error) {
      console.error('[API] /api/upload error', error);
      throw error;
    }
    const { data: pub } = supabaseAdmin.storage.from(bucket).getPublicUrl(data.path);
    return new Response(JSON.stringify({ url: pub.publicUrl || null, path: data.path }), { status: 201 });
  } catch (err) {
    console.error('POST /api/upload error', err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), { status: 500 });
  }
}
