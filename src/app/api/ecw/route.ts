import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { testECWConnection, getPatientByMRN, searchPatients, getPatientConditions, getPatientMedications, getPatientCoverage, mapFHIRPatient } from '@/lib/ecw'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')

  if (action === 'health') {
    const result = await testECWConnection()
    return NextResponse.json(result)
  }

  if (action === 'patient') {
    const mrn = searchParams.get('mrn')
    if (!mrn) return NextResponse.json({ error: 'MRN required' }, { status: 400 })
    try {
      const patient = await getPatientByMRN(mrn)
      if (!patient) return NextResponse.json({ error: 'Patient not found in eCW' }, { status: 404 })
      return NextResponse.json(mapFHIRPatient(patient))
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
  }

  if (action === 'search') {
    const lastName = searchParams.get('lastName') || ''
    const dob = searchParams.get('dob') || undefined
    try {
      const patients = await searchPatients(lastName, dob)
      return NextResponse.json(patients.map(mapFHIRPatient))
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
  }

  if (action === 'conditions') {
    const ecwId = searchParams.get('ecwId')
    if (!ecwId) return NextResponse.json({ error: 'ecwId required' }, { status: 400 })
    try {
      const conditions = await getPatientConditions(ecwId)
      return NextResponse.json(conditions)
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
  }

  if (action === 'medications') {
    const ecwId = searchParams.get('ecwId')
    if (!ecwId) return NextResponse.json({ error: 'ecwId required' }, { status: 400 })
    try {
      const meds = await getPatientMedications(ecwId)
      return NextResponse.json(meds)
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
  }

  if (action === 'coverage') {
    const ecwId = searchParams.get('ecwId')
    if (!ecwId) return NextResponse.json({ error: 'ecwId required' }, { status: 400 })
    try {
      const coverage = await getPatientCoverage(ecwId)
      return NextResponse.json(coverage)
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
  }

  if (action === 'sync') {
    // Sync patient from eCW into local database
    const mrn = searchParams.get('mrn')
    if (!mrn) return NextResponse.json({ error: 'MRN required' }, { status: 400 })
    try {
      const fhirPatient = await getPatientByMRN(mrn)
      if (!fhirPatient) return NextResponse.json({ error: 'Not found in eCW' }, { status: 404 })
      const mapped = mapFHIRPatient(fhirPatient)
      const patient = await prisma.patient.upsert({
        where: { mrn: mapped.mrn || mrn },
        update: { ...mapped, updatedAt: new Date() },
        create: mapped
      })
      return NextResponse.json({ synced: true, patient })
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
  }

  return NextResponse.json({
    info: 'eClinicalWorks FHIR R4 API Integration',
    version: '1.0',
    endpoints: {
      'GET ?action=health': 'Test eCW connectivity',
      'GET ?action=patient&mrn=MRN': 'Lookup patient by MRN',
      'GET ?action=search&lastName=NAME&dob=DOB': 'Search patients',
      'GET ?action=conditions&ecwId=ID': 'Get patient conditions',
      'GET ?action=medications&ecwId=ID': 'Get patient medications',
      'GET ?action=coverage&ecwId=ID': 'Get insurance coverage',
      'GET ?action=sync&mrn=MRN': 'Sync patient from eCW to local DB'
    },
    fhirVersion: 'R4',
    standard: 'SMART on FHIR / OAuth 2.0',
    ecwRegistration: 'https://fhir.eclinicalworks.com/ecwopenapi/'
  })
}
