import {failure,sameOrigin,AccessError} from '@/lib/access';
import {readTesting,writeTesting} from '@/lib/testing-store';
export const dynamic='force-dynamic';
export async function GET(){try{return Response.json(await readTesting(),{headers:{'Cache-Control':'private, no-store'}});}catch(e){return failure(e);}}
export async function PUT(request:Request){try{sameOrigin(request);if(Number(request.headers.get('content-length')??0)>250000)throw new AccessError(413,'Test workspace is too large');const raw=await request.text();if(raw.length>250000)throw new AccessError(413,'Test workspace is too large');const {revision,state}=JSON.parse(raw);return Response.json(await writeTesting(revision,state),{headers:{'Cache-Control':'private, no-store'}});}catch(e){return failure(e);}}
