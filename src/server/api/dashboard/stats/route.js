// src/server/api/dashboard/stats/route.js
// Route optimisée pour récupérer les stats du dashboard par rôle
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Récupérer l'utilisateur authentifié
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
    }

    // Récupérer les stats depuis la table user_stats (optimisé)
    const { data: stats, error: statsError } = await supabaseAdmin
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (statsError) {
      // Si pas de stats, les initialiser
      console.log('Stats not found, initializing...');
      await supabaseAdmin.rpc('refresh_user_stats', { p_user_id: user.id });
      
      // Re-fetch après initialisation
      const { data: newStats } = await supabaseAdmin
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      return new Response(JSON.stringify({ stats: newStats || {} }), { status: 200 });
    }

    return new Response(JSON.stringify({ stats }), { status: 200 });
    
  } catch (err) {
    console.error('GET /api/dashboard/stats error:', err);
    return new Response(
      JSON.stringify({ error: err.message, stats: {} }), 
      { status: 500 }
    );
  }
}

// POST pour forcer le rafraîchissement des stats
export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
    }

    // Rafraîchir les stats
    await supabaseAdmin.rpc('refresh_user_stats', { p_user_id: user.id });

    // Récupérer les nouvelles stats
    const { data: stats } = await supabaseAdmin
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return new Response(JSON.stringify({ stats, refreshed: true }), { status: 200 });
    
  } catch (err) {
    console.error('POST /api/dashboard/stats error:', err);
    return new Response(
      JSON.stringify({ error: err.message }), 
      { status: 500 }
    );
  }
}
