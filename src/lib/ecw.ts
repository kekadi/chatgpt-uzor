/**
 * eClinicalWorks FHIR R4 API Integration
 *
 * This module provides SMART on FHIR / OAuth 2.0 compliant integration
 * with eClinicalWorks EHR for patient data synchronization.
 *
 * eClinicalWorks FHIR API Approval Requirements:
 * - Register at: https://fhir.eclinicalworks.com/ecwopenapi/
 * - Complete eCW API Partner Application
 * - Provide HIPAA BAA / Business Associate Agreement
 * - Complete security questionnaire
 * - Test in eCW sandbox environment
 * - Submit for production approval (2-4 weeks)
 *
 * Supported FHIR Resources: Patient, Encounter, Condition, MedicationRequest,
 * Observation, DiagnosticReport, AllergyIntolerance, Immunization,
 * DocumentReference, ServiceRequest, Coverage
 */

const ECW_BASE = process.env.ECW_FHIR_BASE_URL || ''
const ECW_CLIENT_ID = process.env.ECW_CLIENT_ID || ''
const ECW_CLIENT_SECRET = process.env.ECW_CLIENT_SECRET || ''
const ECW_SCOPE = process.env.ECW_SCOPE || 'openid fhir user/*.read'

let tokenCache: { token: string; expires: number } | null = null

async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expires) {
    return tokenCache.token
  }

  if (!ECW_BASE || !ECW_CLIENT_ID || !ECW_CLIENT_SECRET) {
    throw new Error('eClinicalWorks API credentials not configured. Set ECW_FHIR_BASE_URL, ECW_CLIENT_ID, ECW_CLIENT_SECRET in environment.')
  }

  // Discover the token endpoint via SMART on FHIR metadata
  const metaRes = await fetch(`${ECW_BASE}/metadata`, {
    headers: { Accept: 'application/fhir+json' }
  })
  if (!metaRes.ok) throw new Error(`eCW metadata fetch failed: ${metaRes.status}`)

  const meta = await metaRes.json()
  const securityExt = meta?.rest?.[0]?.security?.extension?.find(
    (e: any) => e.url === 'http://fhir-registry.smarthealthit.org/StructureDefinition/oauth-uris'
  )
  const tokenUrl = securityExt?.extension?.find((e: any) => e.url === 'token')?.valueUri

  if (!tokenUrl) throw new Error('Could not discover eCW token endpoint from SMART metadata')

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: ECW_CLIENT_ID,
    client_secret: ECW_CLIENT_SECRET,
    scope: ECW_SCOPE
  })

  const tokenRes = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    throw new Error(`eCW token request failed: ${tokenRes.status} ${err}`)
  }

  const tokenData = await tokenRes.json()
  tokenCache = {
    token: tokenData.access_token,
    expires: Date.now() + (tokenData.expires_in - 60) * 1000
  }

  return tokenCache.token
}

async function fhirGet(path: string): Promise<any> {
  const token = await getAccessToken()
  const res = await fetch(`${ECW_BASE}/${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/fhir+json'
    }
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`eCW FHIR GET ${path} failed: ${res.status} ${err}`)
  }
  return res.json()
}

// Patient lookup by MRN
export async function getPatientByMRN(mrn: string) {
  const bundle = await fhirGet(`Patient?identifier=${mrn}`)
  return bundle?.entry?.[0]?.resource ?? null
}

// Patient lookup by name / DOB
export async function searchPatients(lastName: string, dob?: string) {
  let query = `Patient?family=${encodeURIComponent(lastName)}`
  if (dob) query += `&birthdate=${dob}`
  const bundle = await fhirGet(query)
  return (bundle?.entry ?? []).map((e: any) => e.resource)
}

// Get patient conditions
export async function getPatientConditions(ecwPatientId: string) {
  const bundle = await fhirGet(`Condition?patient=${ecwPatientId}&clinical-status=active`)
  return (bundle?.entry ?? []).map((e: any) => e.resource)
}

// Get patient medications
export async function getPatientMedications(ecwPatientId: string) {
  const bundle = await fhirGet(`MedicationRequest?patient=${ecwPatientId}&status=active`)
  return (bundle?.entry ?? []).map((e: any) => e.resource)
}

// Get insurance coverage
export async function getPatientCoverage(ecwPatientId: string) {
  const bundle = await fhirGet(`Coverage?patient=${ecwPatientId}&status=active`)
  return (bundle?.entry ?? []).map((e: any) => e.resource)
}

// Get recent encounters
export async function getRecentEncounters(ecwPatientId: string, count = 5) {
  const bundle = await fhirGet(`Encounter?patient=${ecwPatientId}&_sort=-date&_count=${count}`)
  return (bundle?.entry ?? []).map((e: any) => e.resource)
}

// Get lab results
export async function getLabResults(ecwPatientId: string) {
  const bundle = await fhirGet(`Observation?patient=${ecwPatientId}&category=laboratory&_sort=-date&_count=20`)
  return (bundle?.entry ?? []).map((e: any) => e.resource)
}

// Create ServiceRequest (referral order) in eCW
export async function createServiceRequest(payload: {
  patientId: string
  requesterId: string
  performerName: string
  reasonCode: string
  reasonDisplay: string
  priority: 'routine' | 'urgent' | 'stat'
  note?: string
}) {
  const token = await getAccessToken()
  const fhirResource = {
    resourceType: 'ServiceRequest',
    status: 'active',
    intent: 'order',
    priority: payload.priority,
    subject: { reference: `Patient/${payload.patientId}` },
    requester: { reference: `Practitioner/${payload.requesterId}` },
    performer: [{ display: payload.performerName }],
    reasonCode: [{ coding: [{ system: 'http://hl7.org/fhir/sid/icd-10-cm', code: payload.reasonCode, display: payload.reasonDisplay }] }],
    note: payload.note ? [{ text: payload.note }] : undefined,
    authoredOn: new Date().toISOString()
  }

  const res = await fetch(`${ECW_BASE}/ServiceRequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/fhir+json',
      Accept: 'application/fhir+json'
    },
    body: JSON.stringify(fhirResource)
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Failed to create ServiceRequest in eCW: ${res.status} ${err}`)
  }
  return res.json()
}

// Map eCW FHIR Patient to local Patient model
export function mapFHIRPatient(fhirPatient: any) {
  const name = fhirPatient.name?.[0] ?? {}
  const address = fhirPatient.address?.[0] ?? {}
  const phone = fhirPatient.telecom?.find((t: any) => t.system === 'phone')?.value ?? ''
  const insurance = fhirPatient.identifier?.find((i: any) => i.type?.coding?.[0]?.code === 'MB')?.value ?? ''

  return {
    ecwId: fhirPatient.id,
    mrn: fhirPatient.identifier?.find((i: any) => i.use === 'usual')?.value ?? '',
    firstName: name.given?.join(' ') ?? '',
    lastName: name.family ?? '',
    dob: fhirPatient.birthDate ?? '',
    phone,
    address: address.line?.join(', ') ?? '',
    city: address.city ?? '',
    state: address.state ?? '',
    zip: address.postalCode ?? '',
    insId: insurance
  }
}

// Health check for eCW connectivity
export async function testECWConnection(): Promise<{ connected: boolean; message: string }> {
  try {
    if (!ECW_BASE) {
      return { connected: false, message: 'ECW_FHIR_BASE_URL not configured in environment variables.' }
    }
    await getAccessToken()
    return { connected: true, message: 'Successfully connected to eClinicalWorks FHIR API.' }
  } catch (error) {
    return { connected: false, message: error instanceof Error ? error.message : 'Unknown error' }
  }
}
