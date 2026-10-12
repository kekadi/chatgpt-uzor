import {access,failure} from '@/lib/access';
export async function GET(request:Request){try{const a=await access(request);return Response.json({user_id:a.userId,role:a.role,practice_id:a.practice},{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
