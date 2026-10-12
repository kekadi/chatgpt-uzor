import {access,failure} from '@/lib/access';
export async function POST(request:Request){try{await access(request);return Response.json({error:'eClinicalWorks integration is not activated. Vendor approval, tenant capabilities and credentials must be verified.'},{status:501});}catch(e){return failure(e);}}
