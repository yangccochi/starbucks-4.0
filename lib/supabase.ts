export function getSupabaseConfig(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret=process.env.SUPABASE_SECRET_KEY;
  if(!url||!secret) throw new Error('SERVER_CONFIGURATION_MISSING');
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url))throw new Error('INVALID_SUPABASE_URL');
  return {url,secret};
}

export async function supabaseRest(path:string,options:RequestInit={}){
  const {url,secret}=getSupabaseConfig();
  return fetch(`${url}/rest/v1/${path}`,{
    ...options,
    headers:{apikey:secret,'Content-Type':'application/json',...(options.headers||{})},
    cache:'no-store'
  });
}
