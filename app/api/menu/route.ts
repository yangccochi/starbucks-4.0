import {supabaseRest} from '../../../lib/supabase';
export const runtime='nodejs';
export async function GET(){
  try{
    const res=await supabaseRest('products?select=id,name,price,category&is_available=eq.true&order=name.asc');
    if(!res.ok)throw new Error(`Supabase menu returned ${res.status}`);
    return Response.json(await res.json(),{headers:{'Cache-Control':'no-store'}});
  }catch(e){console.error('Menu request failed',e);return Response.json({error:'MENU_UNAVAILABLE'},{status:503});}
}
