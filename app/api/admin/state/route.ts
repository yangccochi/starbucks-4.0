import {NextRequest,NextResponse} from 'next/server';
import {noStore} from '../../../../lib/admin-api';
import {supabaseRest} from '../../../../lib/supabase';
export const runtime='nodejs';
export async function GET(req:NextRequest){
 try{
  const [orders,items,ingredients,products,logs]=await Promise.all([
   supabaseRest('orders?select=id,status,total_amount,inventory_deducted,reason_code,created_at,updated_at&order=created_at.desc&limit=40'),
   supabaseRest('order_items?select=order_id,product_id,quantity,unit_price&order=id.desc&limit=200'),
   supabaseRest('ingredients?select=id,name,unit,initial_quantity,current_quantity,updated_at&order=name.asc'),
   supabaseRest('products?select=id,name,price,category&order=name.asc'),
   supabaseRest('inventory_logs?select=id,order_id,ingredient_id,quantity_change,reason,created_at&order=id.desc&limit=30')
  ]);
  if([orders,items,ingredients,products,logs].some(r=>!r.ok))throw new Error('SUPABASE_QUERY_FAILED');
  const [orderRows,itemRows,stockRows,productRows,logRows]=await Promise.all([orders.json(),items.json(),ingredients.json(),products.json(),logs.json()]);
  return NextResponse.json({orders:orderRows,orderItems:itemRows,ingredients:stockRows,products:productRows,inventoryLogs:logRows,serverTime:new Date().toISOString()},{headers:noStore});
 }catch(e){console.error('Admin state failed',e);return NextResponse.json({error:'STATE_UNAVAILABLE'},{status:503,headers:noStore});}
}
