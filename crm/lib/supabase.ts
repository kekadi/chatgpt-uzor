import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
export async function serverClient(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;if(!url||!key)throw new Error('Supabase is not configured');const jar=await cookies();return createServerClient(url,key,{cookies:{getAll:()=>jar.getAll(),setAll(values){for(const {name,value,options} of values)jar.set(name,value,options);}}});}
