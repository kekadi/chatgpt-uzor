/** Optional adapters: core CRM operations never depend on EHR availability. */
export type ExternalIdentifier={system:'eclinicalworks'|string;resourceType:string;externalId:string;version?:string;lastSyncedAt?:string};
export type IntegrationState='disconnected'|'approved-read-only'|'approved-read-write';
export interface PatientSyncAdapter{state:IntegrationState;readPatient(externalId:string):Promise<unknown>;}
export interface ReferralOrderAdapter{state:IntegrationState;createOrder(caseId:string,idempotencyKey:string):Promise<{externalId:string}>;}
export const ehrConnection={state:'disconnected' as IntegrationState,requiredForCore:false,provider:'eClinicalWorks',writeBackEnabled:false};
