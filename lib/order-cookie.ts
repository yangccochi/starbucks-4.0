import {createHmac,timingSafeEqual} from 'node:crypto';
function sessionSecret(){const secret=process.env.SESSION_SECRET;if(!secret||secret.length<32)throw new Error('SESSION_SECRET_MISSING');return secret;}
export function signOrder(id:string){const signature=createHmac('sha256',sessionSecret()).update(id).digest('hex');return `${id}.${signature}`;}
export function orderCookieMatches(cookie:string|undefined,id:string){
  if(!cookie)return false;
  const lastDot=cookie.lastIndexOf('.');
  if(lastDot<0||cookie.slice(0,lastDot)!==id)return false;
  const expected=Buffer.from(createHmac('sha256',sessionSecret()).update(id).digest('hex'));
  const provided=Buffer.from(cookie.slice(lastDot+1));
  return expected.length===provided.length&&timingSafeEqual(expected,provided);
}
