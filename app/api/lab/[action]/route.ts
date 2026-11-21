import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {auth:{persistSession:false}});
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}});
const authorized=(req:NextRequest)=>!!process.env.LAB_MANAGER_KEY && req.headers.get('x-manager-key')===process.env.LAB_MANAGER_KEY;
const actionOf=(req:NextRequest)=>req.nextUrl.pathname.split('/').filter(Boolean).pop();
export async function GET(req:NextRequest){
 try {const s=db(); const action=actionOf(req);
 if(action==='menu'){const {data,error}=await s.from('lab_menu').select('*').order('name');if(error)throw error;return reply(data);}
 if(action==='state'){if(!authorized(req))return reply({error:'Unauthorized'},401);const [stock,orders]=await Promise.all([s.from('lab_stock').select('*').order('id'),s.from('lab_orders').select('*').order('created_at',{ascending:false}).limit(100)]);if(stock.error)throw stock.error;if(orders.error)throw orders.error;return reply({stock:stock.data,orders:orders.data});}
 return reply({error:'Not found'},404);
 }catch(e){console.error(e);return reply({error:'Database request failed'},500);}
}
export async function POST(req:NextRequest){
 try{const s=db();const action=actionOf(req);const b=await req.json();
 if(action==='order'){const {data,error}=await s.rpc('lab_place_order',{p_menu:b.menu,p_size:b.size,p_milk:b.milk??null,p_shots:b.shots,p_sweetness:b.sweetness});if(error)return reply({error:error.message},400);return reply(data,201);}
 if(!authorized(req))return reply({error:'Unauthorized'},401);
 if(action==='status'){if(!['preparing','completed'].includes(b.status))return reply({error:'Invalid status'},400);const previous=b.status==='preparing'?'queued':'preparing';const {data,error}=await s.from('lab_orders').update({status:b.status}).eq('id',b.id).eq('status',previous).select().single();if(error)return reply({error:'Invalid order transition'},409);return reply(data);}
 return reply({error:'Not found'},404);
 }catch(e){console.error(e);return reply({error:'Invalid request'},400);}
}
