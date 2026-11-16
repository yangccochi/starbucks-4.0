import {NextRequest} from 'next/server';
import {mutateOrder} from '../../../../lib/admin-api';
export const runtime='nodejs';
export async function POST(req:NextRequest){return mutateOrder(req,'complete_order');}
