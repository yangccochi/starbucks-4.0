import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });
const reply = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const actionOf = (req: NextRequest) => req.nextUrl.pathname.split('/').filter(Boolean).pop();
const cookieName = 'starbucks_lab_manager_session';
const managerEmails = () => (process.env.LAB_MANAGER_EMAILS ?? '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
async function authorized(req: NextRequest) {
  const token = req.cookies.get(cookieName)?.value;
  if (!token || managerEmails().length === 0) return false;
  const { data, error } = await db().auth.getUser(token);
  return !error && !!data.user?.email && managerEmails().includes(data.user.email.toLowerCase());
}
export async function GET(req: NextRequest) {
  try {
    const s = db(); const action = actionOf(req);
    if (action === 'menu') { const { data, error } = await s.from('lab_menu').select('*').order('name'); if (error) throw error; return reply(data); }
    if (action === 'session') return reply({ authenticated: await authorized(req) });
    if (action === 'track') { const id = req.nextUrl.searchParams.get('id'); if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return reply({ error: 'Invalid order ID' }, 400); const { data, error } = await s.from('lab_orders').select('id,name,status,total,created_at').eq('id',id).maybeSingle(); if (error) throw error; return data ? reply(data) : reply({ error: 'Order not found' }, 404); }
    if (action === 'state') {
      if (!await authorized(req)) return reply({ error: 'Manager login required' }, 401);
      const [stock, orders] = await Promise.all([s.from('lab_stock').select('*').order('id'), s.from('lab_orders').select('*').order('created_at', { ascending: false }).limit(100)]);
      if (stock.error) throw stock.error; if (orders.error) throw orders.error;
      return reply({ stock: stock.data, orders: orders.data });
    }
    return reply({ error: 'Not found' }, 404);
  } catch (e) { console.error(e); return reply({ error: 'Database request failed' }, 500); }
}
export async function POST(req: NextRequest) {
  try {
    const s = db(); const action = actionOf(req);
    if (action === 'logout') { const res = reply({ ok: true }); res.cookies.set(cookieName, '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 }); return res; }
    const b = await req.json();
    if (action === 'login') {
      if (typeof b.email !== 'string' || typeof b.password !== 'string') return reply({ error: 'Email and password required' }, 400);
      if (!managerEmails().includes(b.email.trim().toLowerCase())) return reply({ error: 'Invalid manager credentials' }, 401);
      const { data, error } = await s.auth.signInWithPassword({ email: b.email.trim(), password: b.password });
      if (error || !data.session || !data.user.email || !managerEmails().includes(data.user.email.toLowerCase())) return reply({ error: 'Invalid manager credentials' }, 401);
      const res = reply({ ok: true });
      res.cookies.set(cookieName, data.session.access_token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/api/lab', maxAge: Math.min(data.session.expires_in ?? 3600, 3600) });
      return res;
    }
    if (action === 'order') {
      const { data, error } = await s.rpc('lab_place_order', { p_menu: b.menu, p_size: b.size, p_milk: b.milk ?? null, p_shots: b.shots, p_sweetness: b.sweetness });
      if (error) return reply({ error: error.message }, 400); return reply(data, 201);
    }
    if (!await authorized(req)) return reply({ error: 'Manager login required' }, 401);
    if (action === 'status') {
      if (!['preparing', 'completed'].includes(b.status)) return reply({ error: 'Invalid status' }, 400);
      const previous = b.status === 'preparing' ? 'queued' : 'preparing';
      const { data, error } = await s.from('lab_orders').update({ status: b.status }).eq('id', b.id).eq('status', previous).select().single();
      if (error) return reply({ error: 'Invalid order transition' }, 409); return reply(data);
    }
    return reply({ error: 'Not found' }, 404);
  } catch (e) { console.error(e); return reply({ error: 'Invalid request' }, 400); }
}
