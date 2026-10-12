import Workspace from '@/components/workspace';
export const dynamic='force-dynamic';
export default function Page(){return <Workspace initialAsOf={new Date().toISOString()} testStorageEnabled={process.env.CRM_TEST_STORAGE_ENABLED==='true'} liveAvailable={process.env.CRM_LIVE_DATA_ENABLED==='true'}/>;}
