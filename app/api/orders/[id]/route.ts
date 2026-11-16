import {NextRequest,NextResponse} from 'next/server';
import {supabaseRest} from '../../../../lib/supabase';
import {orderCookieMatches} from '../../../../lib/order-cookie';
export const runtime='nodejs';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  if(!uuid.test(id))return NextResponse.json({error:'INVALID_ORDER_ID'},{status:400});
  try{
    if(!orderCookieMatches(req.cookies.get('mb_order')?.value,id))return NextResponse.json({error:'FORBIDDEN'},{status:403});
    const [o,i]=await Promise.all([
      supabaseRest(`orders?id=eq.${id}&select=id,status,total_amount,inventory_deducted,reason_code,created_at`),
      supabaseRest(`order_items?order_id=eq.${id}&select=product_id,quantity,unit_price`)
    ]);
    if(!o.ok||!i.ok)throw new Error('SUPABASE_LOOKUP_FAILED');
    const orders=await o.json();if(!orders.length)return NextResponse.json({error:'NOT_FOUND'},{status:404});
    const order=orders[0];const items=await i.json();
    return NextResponse.json({orderId:order.id,status:order.status,totalAmount:order.total_amount,inventoryDeducted:order.inventory_deducted,reasonCode:order.reason_code,createdAt:order.created_at,items:items.map((x:any)=>({productId:x.product_id,quantity:x.quantity,unitPrice:x.unit_price}))},{headers:{'Cache-Control':'no-store'}});
  }catch(e){console.error('Order lookup failed',e);return NextResponse.json({error:'ORDER_SERVICE_UNAVAILABLE'},{status:503});}
}
