import type {NextRequest} from 'next/server';
export function originOkay(req:NextRequest){const origin=req.headers.get('origin');return !!origin&&origin===req.nextUrl.origin;}
