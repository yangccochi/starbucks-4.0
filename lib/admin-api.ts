import {NextRequest,NextResponse} from 'next/server';
import {originOkay} from './admin-auth';
import {supabaseRest} from './supabase';
export const noStore={'Cache-Control':'no-store'};
export async function mutateOrder(req:NextRequest,procedure:'start_order'|'complete_order'){
 // Public demo: no administrator login is required.
 // Origin validation still rejects ordinary cross-origin browser requests.

 if(!originOkay(req))return NextResponse.json({error:'FORBIDDEN_ORIGIN'},{status:403});
 let id='';try{const body=await req.json();id=body.orderId;}catch{return NextResponse.json({error:'INVALID_REQUEST'},{status:400});}
 if(typeof id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))return NextResponse.json({error:'INVALID_ORDER_ID'},{status:400});
 try{
  const r=await supabaseRest('rpc/'+procedure,{method:'POST',body:JSON.stringify({p_order_id:id})});
  if(!r.ok){const t=await r.text();const known=['INSUFFICIENT_STOCK','INVALID_ORDER_STATE','ORDER_NOT_FOUND','INVALID_ORDER_RECIPE'];return NextResponse.json({error:known.find(x=>t.includes(x))||'OPERATION_FAILED'},{status:409,headers:noStore});}
  return NextResponse.json(await r.json(),{headers:noStore});
 }catch(e){console.error(procedure,e);return NextResponse.json({error:'SERVER_ERROR'},{status:503});}
}
