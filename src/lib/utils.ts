import { type ClassValue, clsx } from 'clsx'
import { differenceInDays, format, parseISO, isValid } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(d)) return '—'
    return format(d, 'MM/dd/yyyy')
  } catch {
    return '—'
  }
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(d)) return '—'
    return format(d, 'MM/dd/yyyy hh:mm a')
  } catch {
    return '—'
  }
}

export function daysOpen(date: Date | string | null | undefined): number {
  if (!date) return 0
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(d)) return 0
    return differenceInDays(new Date(), d)
  } catch {
    return 0
  }
}

export type AgingFlag = 'red' | 'yellow' | 'green'

export function getAgingFlag(
  dateOrdered: Date | string | null | undefined,
  urgency: string = 'Routine',
  status: string = 'Pending'
): AgingFlag {
  const terminalStatuses = ['Completed', 'Delivered', 'Cancelled', 'Withdrawn', 'Won', 'Lost']
  if (terminalStatuses.includes(status)) return 'green'

  const days = daysOpen(dateOrdered)
  if (urgency === 'STAT') {
    if (days >= 2) return 'red'
    if (days >= 1) return 'yellow'
    return 'green'
  }
  if (urgency === 'Urgent') {
    if (days >= 7) return 'red'
    if (days >= 4) return 'yellow'
    return 'green'
  }
  // Routine
  if (days >= 14) return 'red'
  if (days >= 7) return 'yellow'
  return 'green'
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    Pending: 'bg-gray-100 text-gray-700',
    Submitted: 'bg-blue-100 text-blue-700',
    Sent: 'bg-blue-100 text-blue-700',
    Ordered: 'bg-indigo-100 text-indigo-700',
    Scheduled: 'bg-purple-100 text-purple-700',
    Approved: 'bg-green-100 text-green-700',
    Completed: 'bg-green-100 text-green-700',
    Delivered: 'bg-green-100 text-green-700',
    Won: 'bg-green-100 text-green-700',
    Denied: 'bg-red-100 text-red-700',
    Cancelled: 'bg-gray-100 text-gray-500',
    Withdrawn: 'bg-gray-100 text-gray-500',
    Lost: 'bg-red-100 text-red-700',
    P2P: 'bg-orange-100 text-orange-700',
    Appealed: 'bg-yellow-100 text-yellow-700',
    Expired: 'bg-red-100 text-red-700'
  }
  return map[status] ?? 'bg-gray-100 text-gray-700'
}

export function getUrgencyColor(urgency: string): string {
  if (urgency === 'STAT') return 'bg-red-100 text-red-700'
  if (urgency === 'Urgent') return 'bg-orange-100 text-orange-700'
  return 'bg-gray-100 text-gray-600'
}

export function generateRefNumber(prefix: string): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 90000) + 10000
  return `${prefix}-${year}-${random}`
}

export const SPECIALTIES = [
  'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology',
  'Geriatrics', 'Hematology', 'Infectious Disease', 'Nephrology',
  'Neurology', 'Ophthalmology', 'Orthopedics', 'Otolaryngology (ENT)',
  'Pain Management', 'Palliative Care', 'Physical Therapy', 'Podiatry',
  'Psychiatry', 'Pulmonology', 'Rheumatology', 'Sleep Medicine',
  'Urology', 'Vascular Surgery', 'Wound Care', 'Other'
]

export const PAYERS = [
  'Medicare', 'Medicaid', 'Medicare/Medicaid (Dual)',
  'Humana Medicare Advantage', 'UnitedHealthcare Medicare Advantage',
  'Aetna Medicare Advantage', 'BCBS Medicare Advantage',
  'Cigna Medicare Advantage', 'WellCare Medicare Advantage',
  'Blue Cross Blue Shield', 'United Healthcare', 'Aetna',
  'Cigna', 'Other'
]

export const DME_EQUIPMENT = [
  'Wheelchair - Manual', 'Wheelchair - Power (Group 1)', 'Wheelchair - Power (Group 2)',
  'Walker / Rollator', 'Cane', 'Crutches',
  'Hospital Bed - Manual', 'Hospital Bed - Semi-Electric', 'Hospital Bed - Full Electric',
  'CPAP Machine', 'BiPAP Machine', 'Oxygen Concentrator',
  'Nebulizer Machine', 'Suction Machine',
  'Continuous Glucose Monitor (CGM)', 'Insulin Pump',
  'Blood Glucose Monitor', 'Blood Pressure Monitor',
  'Commode Chair', 'Bath Chair / Bench', 'Grab Bars',
  'Knee Brace', 'Back Brace', 'AFO / KAFO',
  'TENS Unit', 'Compression Stockings',
  'Enteral Nutrition Pump', 'Hospital Supplies',
  'Other'
]

export const DENIAL_REASONS = [
  'Not medically necessary',
  'Service not covered under plan',
  'Prior authorization not obtained',
  'Duplicate claim / service',
  'Experimental or investigational',
  'Documentation incomplete',
  'Incorrect billing code',
  'Provider not in network',
  'Benefit maximum reached',
  'Coordination of benefits issue',
  'Patient not eligible on date of service',
  'Other'
]
