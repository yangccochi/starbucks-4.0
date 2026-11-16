import {NextRequest,NextResponse} from 'next/server';
import {supabaseRest} from '../../../lib/supabase';
import {signOrder} from '../../../lib/order-cookie';
export const runtime='nodejs';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function sameOrigin(req:NextRequest){const origin=req.headers.get('origin');return !!origin&&new URL(origin).origin===req.nextUrl.origin;}
export async function POST(req:NextRequest){
  // Browser same-origin check. A public guest endpoint additionally needs rate-limiting before public launch.
  if(!sameOrigin(req))return NextResponse.json({error:'FORBIDDEN_ORIGIN'},{status:403});
  const type=req.headers.get('content-type')||'';
  if(!type.toLowerCase().includes('application/json'))return NextResponse.json({error:'INVALID_ORDER'},{status:415});
  let body:any;
  try{const raw=await req.text();if(raw.length>4096)throw new Error('TOO_LARGE');body=JSON.parse(raw);}catch{return NextResponse.json({error:'INVALID_ORDER'},{status:400});}
  if(!body||!uuid.test(body.requestId||'')||!Array.isArray(body.items)||body.items.length<1||body.items.length>20||body.items.some((x:any)=>!x||typeof x.menuId!=='string'||!Number.isInteger(x.quantity)||x.quantity<1||x.quantity>20))return NextResponse.json({error:'INVALID_ORDER'},{status:400});
  try{
    // Verify cookie configuration before creating a durable order.
    signOrder(body.requestId);
    const res=await supabaseRest('rpc/create_order',{method:'POST',body:JSON.stringify({p_request_id:body.requestId,p_items:body.items})});
    if(!res.ok){
      const errorText=await res.text();
      const recognized=['INVALID_ORDER','INSUFFICIENT_STOCK','SYSTEM_BUSY','REQUEST_CONFLICT'];
      const error=recognized.find(code=>errorText.includes(code))||'ORDER_FAILED';
      return NextResponse.json({error},{status:error==='SYSTEM_BUSY'?409:error==='INSUFFICIENT_STOCK'?409:error==='REQUEST_CONFLICT'?409:error==='INVALID_ORDER'?400:502});
    }
    const order=await res.json();
    if(!uuid.test(order.orderId))throw new Error('INVALID_ORDER_ID');
    const response=NextResponse.json(order,{status:201,headers:{'Cache-Control':'no-store'}});
    response.cookies.set('mb_order',signOrder(order.orderId),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*7});
    return response;
  }catch(e){console.error('Create order failed',e);return NextResponse.json({error:'ORDER_SERVICE_UNAVAILABLE'},{status:503});}
}
