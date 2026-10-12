import ExcelJS from 'exceljs'
import { formatDate, daysOpen, getAgingFlag } from './utils'

const RED = 'FFFF0000'
const YELLOW = 'FFFFFF00'
const GREEN = 'FF92D050'
const ORANGE = 'FFFF6600'
const HEADER_FILL = '1E40AF'
const HEADER_FONT_COLOR = 'FFFFFFFF'
const ALT_ROW = 'FFDBEAFE'

function styleHeader(row: ExcelJS.Row) {
  row.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
    cell.font = { color: { argb: HEADER_FONT_COLOR }, bold: true, size: 11 }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' }
    }
  })
  row.height = 30
}

function styleDataRow(row: ExcelJS.Row, isAlt: boolean, agingFlag?: string) {
  let bg = isAlt ? ALT_ROW : 'FFFFFFFF'
  if (agingFlag === 'red') bg = 'FFFFCCCC'
  if (agingFlag === 'yellow') bg = 'FFFFFFCC'

  row.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
    cell.alignment = { vertical: 'middle', wrapText: false }
    cell.border = {
      top: { style: 'hair' }, bottom: { style: 'hair' },
      left: { style: 'hair' }, right: { style: 'hair' }
    }
  })
  row.height = 20
}

function addAgingCell(row: ExcelJS.Row, colIdx: number, flag: string, days: number) {
  const cell = row.getCell(colIdx)
  cell.value = `${days}d`
  const argb = flag === 'red' ? RED : flag === 'yellow' ? YELLOW : GREEN
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } }
  cell.font = { bold: true, size: 10 }
  cell.alignment = { horizontal: 'center' }
}

export async function generateExcelWorkbook(data: {
  referrals: any[]
  dmeOrders: any[]
  priorAuths: any[]
  appeals: any[]
  specialists: any[]
  vendors: any[]
  users: any[]
}): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Burleson Geriatric Primary Care CRM'
  wb.created = new Date()

  // ── REFERRALS tab ──
  const refSheet = wb.addWorksheet('Referrals')
  refSheet.columns = [
    { header: 'Ref #', key: 'refNumber', width: 16 },
    { header: 'Patient', key: 'patient', width: 22 },
    { header: 'MRN', key: 'mrn', width: 14 },
    { header: 'Specialty', key: 'specialty', width: 20 },
    { header: 'Specialist', key: 'specialist', width: 28 },
    { header: 'Urgency', key: 'urgency', width: 10 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Payer', key: 'payer', width: 24 },
    { header: 'Auth #', key: 'authNumber', width: 16 },
    { header: 'ICD-10', key: 'icdCode', width: 12 },
    { header: 'Date Ordered', key: 'dateOrdered', width: 14 },
    { header: 'Date Sent', key: 'dateSent', width: 14 },
    { header: 'Date Scheduled', key: 'dateScheduled', width: 16 },
    { header: 'Days Open', key: 'daysOpen', width: 12 },
    { header: 'Flag', key: 'flag', width: 8 },
    { header: 'Assigned To', key: 'assignedTo', width: 18 },
    { header: 'Provider', key: 'provider', width: 20 },
    { header: 'Notes', key: 'notes', width: 35 }
  ]
  styleHeader(refSheet.getRow(1))
  refSheet.autoFilter = { from: 'A1', to: 'R1' }
  refSheet.views = [{ state: 'frozen', ySplit: 1 }]

  data.referrals.forEach((r, i) => {
    const days = daysOpen(r.dateOrdered)
    const flag = getAgingFlag(r.dateOrdered, r.urgency, r.status)
    const row = refSheet.addRow({
      refNumber: r.refNumber,
      patient: `${r.patient?.lastName}, ${r.patient?.firstName}`,
      mrn: r.patient?.mrn,
      specialty: r.specialty,
      specialist: r.specialist || 'TBD',
      urgency: r.urgency,
      status: r.status,
      payer: r.payer,
      authNumber: r.authNumber || '',
      icdCode: r.icdCode,
      dateOrdered: r.dateOrdered ? new Date(r.dateOrdered) : '',
      dateSent: r.dateSent ? new Date(r.dateSent) : '',
      dateScheduled: r.dateScheduled ? new Date(r.dateScheduled) : '',
      daysOpen: days,
      flag: flag === 'red' ? '🔴 OVERDUE' : flag === 'yellow' ? '🟡 AGING' : '🟢 OK',
      assignedTo: r.assignedTo?.name || 'Unassigned',
      provider: r.referringProvider,
      notes: r.notes
    })
    styleDataRow(row, i % 2 === 1, flag)
    addAgingCell(row, 15, flag, days)
    // Date formatting
    ;[11, 12, 13].forEach(c => {
      const cell = row.getCell(c)
      if (cell.value instanceof Date) cell.numFmt = 'mm/dd/yyyy'
    })
  })

  // ── DME ORDERS tab ──
  const dmeSheet = wb.addWorksheet('DME Orders')
  dmeSheet.columns = [
    { header: 'Order #', key: 'orderNumber', width: 16 },
    { header: 'Patient', key: 'patient', width: 22 },
    { header: 'MRN', key: 'mrn', width: 14 },
    { header: 'Equipment', key: 'equipment', width: 30 },
    { header: 'Vendor', key: 'vendor', width: 25 },
    { header: 'Urgency', key: 'urgency', width: 10 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Payer', key: 'payer', width: 24 },
    { header: 'Auth #', key: 'authNumber', width: 16 },
    { header: 'ICD-10', key: 'icdCode', width: 12 },
    { header: 'Date Ordered', key: 'dateOrdered', width: 14 },
    { header: 'Date Submitted', key: 'dateSubmitted', width: 14 },
    { header: 'Date Delivered', key: 'dateDelivered', width: 14 },
    { header: 'Days Open', key: 'daysOpen', width: 12 },
    { header: 'Flag', key: 'flag', width: 12 },
    { header: 'Assigned To', key: 'assignedTo', width: 18 },
    { header: 'Denial Reason', key: 'denialReason', width: 30 }
  ]
  styleHeader(dmeSheet.getRow(1))
  dmeSheet.autoFilter = { from: 'A1', to: 'Q1' }
  dmeSheet.views = [{ state: 'frozen', ySplit: 1 }]

  data.dmeOrders.forEach((d, i) => {
    const days = daysOpen(d.dateOrdered)
    const flag = getAgingFlag(d.dateOrdered, d.urgency, d.status)
    const row = dmeSheet.addRow({
      orderNumber: d.orderNumber,
      patient: `${d.patient?.lastName}, ${d.patient?.firstName}`,
      mrn: d.patient?.mrn,
      equipment: d.equipment,
      vendor: d.vendor || 'TBD',
      urgency: d.urgency,
      status: d.status,
      payer: d.payer,
      authNumber: d.authNumber || '',
      icdCode: d.icdCode,
      dateOrdered: d.dateOrdered ? new Date(d.dateOrdered) : '',
      dateSubmitted: d.dateSubmitted ? new Date(d.dateSubmitted) : '',
      dateDelivered: d.dateDelivered ? new Date(d.dateDelivered) : '',
      daysOpen: days,
      flag: flag === 'red' ? '🔴 OVERDUE' : flag === 'yellow' ? '🟡 AGING' : '🟢 OK',
      assignedTo: d.assignedTo?.name || 'Unassigned',
      denialReason: d.denialReason || ''
    })
    styleDataRow(row, i % 2 === 1, flag)
  })

  // ── PRIOR AUTH tab ──
  const paSheet = wb.addWorksheet('Prior Authorizations')
  paSheet.columns = [
    { header: 'PA #', key: 'paNumber', width: 16 },
    { header: 'Patient', key: 'patient', width: 22 },
    { header: 'Service Type', key: 'serviceType', width: 14 },
    { header: 'Service', key: 'service', width: 28 },
    { header: 'Payer', key: 'payer', width: 24 },
    { header: 'Urgency', key: 'urgency', width: 10 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Auth #', key: 'authNumber', width: 16 },
    { header: 'ICD-10', key: 'icdCode', width: 12 },
    { header: 'CPT Code', key: 'cptCode', width: 12 },
    { header: 'Date Requested', key: 'dateRequested', width: 15 },
    { header: 'Date Decision', key: 'dateDecision', width: 14 },
    { header: 'Expiration', key: 'expiration', width: 14 },
    { header: 'Days Open', key: 'daysOpen', width: 12 },
    { header: 'Flag', key: 'flag', width: 12 },
    { header: 'Denial Code', key: 'denialCode', width: 14 },
    { header: 'Denial Reason', key: 'denialReason', width: 30 },
    { header: 'Assigned To', key: 'assignedTo', width: 18 }
  ]
  styleHeader(paSheet.getRow(1))
  paSheet.autoFilter = { from: 'A1', to: 'R1' }
  paSheet.views = [{ state: 'frozen', ySplit: 1 }]

  data.priorAuths.forEach((p, i) => {
    const days = daysOpen(p.dateRequested)
    const flag = getAgingFlag(p.dateRequested, p.urgency, p.status)
    const row = paSheet.addRow({
      paNumber: p.paNumber,
      patient: `${p.patient?.lastName}, ${p.patient?.firstName}`,
      serviceType: p.serviceType,
      service: p.service,
      payer: p.payer,
      urgency: p.urgency,
      status: p.status,
      authNumber: p.authNumber || '',
      icdCode: p.icdCode,
      cptCode: p.cptCode,
      dateRequested: p.dateRequested ? new Date(p.dateRequested) : '',
      dateDecision: p.dateDecision ? new Date(p.dateDecision) : '',
      expiration: p.expirationDate ? new Date(p.expirationDate) : '',
      daysOpen: days,
      flag: flag === 'red' ? '🔴 OVERDUE' : flag === 'yellow' ? '🟡 AGING' : '🟢 OK',
      denialCode: p.denialCode || '',
      denialReason: p.denialReason || '',
      assignedTo: p.assignedTo?.name || 'Unassigned'
    })
    styleDataRow(row, i % 2 === 1, flag)
  })

  // ── P2P APPEALS LOG ──
  const apSheet = wb.addWorksheet('P2P Appeal Log')
  apSheet.columns = [
    { header: 'Appeal #', key: 'appealNumber', width: 16 },
    { header: 'Reference', key: 'referenceId', width: 16 },
    { header: 'Appeal Type', key: 'appealType', width: 14 },
    { header: 'Payer', key: 'payer', width: 24 },
    { header: 'Service', key: 'service', width: 28 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Outcome', key: 'outcome', width: 14 },
    { header: 'P2P Physician', key: 'p2pPhysician', width: 20 },
    { header: 'Scheduled Date', key: 'scheduledDate', width: 15 },
    { header: 'Completed Date', key: 'completedDate', width: 15 },
    { header: 'Days Open', key: 'daysOpen', width: 12 },
    { header: 'Assigned To', key: 'assignedTo', width: 18 },
    { header: 'Notes', key: 'notes', width: 40 }
  ]
  styleHeader(apSheet.getRow(1))
  apSheet.autoFilter = { from: 'A1', to: 'M1' }
  apSheet.views = [{ state: 'frozen', ySplit: 1 }]

  data.appeals.forEach((a, i) => {
    const days = daysOpen(a.createdAt)
    const row = apSheet.addRow({
      appealNumber: a.appealNumber,
      referenceId: a.referenceId,
      appealType: a.appealType,
      payer: a.payer,
      service: a.service,
      status: a.status,
      outcome: a.outcome || '',
      p2pPhysician: a.p2pPhysician || '',
      scheduledDate: a.scheduledDate ? new Date(a.scheduledDate) : '',
      completedDate: a.completedDate ? new Date(a.completedDate) : '',
      daysOpen: days,
      assignedTo: a.assignedTo?.name || 'Unassigned',
      notes: a.notes
    })
    styleDataRow(row, i % 2 === 1)
  })

  // ── KPI DASHBOARD tab ──
  const kpiSheet = wb.addWorksheet('KPI Dashboard')
  kpiSheet.getColumn(1).width = 35
  kpiSheet.getColumn(2).width = 18
  kpiSheet.getColumn(3).width = 18
  kpiSheet.getColumn(4).width = 18

  const addKPISection = (title: string, rowStart: number) => {
    const titleRow = kpiSheet.getRow(rowStart)
    const cell = titleRow.getCell(1)
    cell.value = title
    cell.font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
    kpiSheet.mergeCells(`A${rowStart}:D${rowStart}`)
    titleRow.height = 25
  }

  const openRef = data.referrals.filter(r => !['Completed', 'Cancelled'].includes(r.status))
  const overdueRef = openRef.filter(r => getAgingFlag(r.dateOrdered, r.urgency, r.status) === 'red')
  const agingRef = openRef.filter(r => getAgingFlag(r.dateOrdered, r.urgency, r.status) === 'yellow')
  const completedRef = data.referrals.filter(r => r.status === 'Completed')
  const deniedRef = data.referrals.filter(r => r.status === 'Denied')

  const openDME = data.dmeOrders.filter(d => !['Delivered', 'Cancelled'].includes(d.status))
  const overdueDME = openDME.filter(d => getAgingFlag(d.dateOrdered, d.urgency, d.status) === 'red')

  const openPA = data.priorAuths.filter(p => !['Approved', 'Denied', 'Expired', 'Withdrawn'].includes(p.status))
  const deniedPA = data.priorAuths.filter(p => p.status === 'Denied')
  const approvedPA = data.priorAuths.filter(p => p.status === 'Approved')

  const addKPIRow = (sheet: ExcelJS.Worksheet, row: number, label: string, value: any, color?: string) => {
    const r = sheet.getRow(row)
    r.getCell(1).value = label
    r.getCell(2).value = value
    if (color) {
      r.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } }
      r.getCell(2).font = { bold: true }
    }
    r.getCell(1).alignment = { vertical: 'middle' }
    r.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
    r.height = 22
  }

  addKPISection('REFERRAL KPIs', 1)
  addKPIRow(kpiSheet, 2, 'Total Referrals', data.referrals.length)
  addKPIRow(kpiSheet, 3, 'Open Referrals', openRef.length, 'FF93C5FD')
  addKPIRow(kpiSheet, 4, '🔴 Overdue (>14d Routine / >7d Urgent)', overdueRef.length, RED)
  addKPIRow(kpiSheet, 5, '🟡 Aging (7-14d Routine / 4-7d Urgent)', agingRef.length, YELLOW)
  addKPIRow(kpiSheet, 6, 'Completed Referrals', completedRef.length, GREEN)
  addKPIRow(kpiSheet, 7, 'Denied Referrals', deniedRef.length, 'FFFF6B6B')
  addKPIRow(kpiSheet, 8, 'Denial Rate', data.referrals.length ? `${((deniedRef.length / data.referrals.length) * 100).toFixed(1)}%` : '0%')

  addKPISection('DME ORDER KPIs', 10)
  addKPIRow(kpiSheet, 11, 'Total DME Orders', data.dmeOrders.length)
  addKPIRow(kpiSheet, 12, 'Open Orders', openDME.length, 'FF93C5FD')
  addKPIRow(kpiSheet, 13, '🔴 Overdue Orders', overdueDME.length, RED)
  addKPIRow(kpiSheet, 14, 'Delivered', data.dmeOrders.filter(d => d.status === 'Delivered').length, GREEN)
  addKPIRow(kpiSheet, 15, 'Denied', data.dmeOrders.filter(d => d.status === 'Denied').length, 'FFFF6B6B')

  addKPISection('PRIOR AUTH KPIs', 17)
  addKPIRow(kpiSheet, 18, 'Total Prior Auths', data.priorAuths.length)
  addKPIRow(kpiSheet, 19, 'Open / Pending', openPA.length, 'FF93C5FD')
  addKPIRow(kpiSheet, 20, 'Approved', approvedPA.length, GREEN)
  addKPIRow(kpiSheet, 21, 'Denied', deniedPA.length, 'FFFF6B6B')
  addKPIRow(kpiSheet, 22, 'Approval Rate', data.priorAuths.length ? `${((approvedPA.length / data.priorAuths.length) * 100).toFixed(1)}%` : '0%')

  addKPISection('APPEAL KPIs', 24)
  addKPIRow(kpiSheet, 25, 'Total Appeals', data.appeals.length)
  addKPIRow(kpiSheet, 26, 'Won', data.appeals.filter(a => a.status === 'Won').length, GREEN)
  addKPIRow(kpiSheet, 27, 'Pending / In Progress', data.appeals.filter(a => ['Pending', 'Scheduled'].includes(a.status)).length, 'FFFF6B6B')

  // ── MONTHLY ROLLUP tab ──
  const rollSheet = wb.addWorksheet('Monthly Rollup')
  rollSheet.columns = [
    { header: 'Month', key: 'month', width: 14 },
    { header: 'New Referrals', key: 'newRef', width: 16 },
    { header: 'Completed Ref', key: 'compRef', width: 16 },
    { header: 'Denied Ref', key: 'denRef', width: 14 },
    { header: 'New DME', key: 'newDME', width: 14 },
    { header: 'Delivered DME', key: 'delDME', width: 16 },
    { header: 'New PA', key: 'newPA', width: 12 },
    { header: 'Approved PA', key: 'appPA', width: 14 },
    { header: 'Denied PA', key: 'denPA', width: 12 },
    { header: 'Appeals Filed', key: 'appFiled', width: 14 },
    { header: 'Appeals Won', key: 'appWon', width: 14 }
  ]
  styleHeader(rollSheet.getRow(1))
  rollSheet.views = [{ state: 'frozen', ySplit: 1 }]

  // Generate last 6 months of data
  for (let m = 5; m >= 0; m--) {
    const d = new Date()
    d.setMonth(d.getMonth() - m)
    const monthLabel = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1)
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0)

    const inMonth = (date: any) => {
      if (!date) return false
      const dd = new Date(date)
      return dd >= monthStart && dd <= monthEnd
    }

    rollSheet.addRow({
      month: monthLabel,
      newRef: data.referrals.filter(r => inMonth(r.dateOrdered)).length,
      compRef: data.referrals.filter(r => r.status === 'Completed' && inMonth(r.dateCompleted)).length,
      denRef: data.referrals.filter(r => r.status === 'Denied' && inMonth(r.updatedAt)).length,
      newDME: data.dmeOrders.filter(d => inMonth(d.dateOrdered)).length,
      delDME: data.dmeOrders.filter(d => d.status === 'Delivered' && inMonth(d.dateDelivered)).length,
      newPA: data.priorAuths.filter(p => inMonth(p.dateRequested)).length,
      appPA: data.priorAuths.filter(p => p.status === 'Approved' && inMonth(p.dateDecision)).length,
      denPA: data.priorAuths.filter(p => p.status === 'Denied' && inMonth(p.dateDecision)).length,
      appFiled: data.appeals.filter(a => inMonth(a.createdAt)).length,
      appWon: data.appeals.filter(a => a.status === 'Won' && inMonth(a.completedDate)).length
    })
  }

  // ── STAFF PRODUCTIVITY tab ──
  const staffSheet = wb.addWorksheet('Staff Productivity')
  staffSheet.columns = [
    { header: 'Staff Member', key: 'name', width: 22 },
    { header: 'Role', key: 'role', width: 14 },
    { header: 'Referrals Assigned', key: 'refAssigned', width: 18 },
    { header: 'Referrals Completed', key: 'refCompleted', width: 20 },
    { header: 'Ref Completion Rate', key: 'refRate', width: 20 },
    { header: 'DME Assigned', key: 'dmeAssigned', width: 16 },
    { header: 'DME Delivered', key: 'dmeDelivered', width: 16 },
    { header: 'PA Assigned', key: 'paAssigned', width: 14 },
    { header: 'PA Approved', key: 'paApproved', width: 14 },
    { header: 'Appeals Handled', key: 'appeals', width: 16 }
  ]
  styleHeader(staffSheet.getRow(1))

  data.users.filter(u => u.role !== 'admin').forEach((u, i) => {
    const refs = data.referrals.filter(r => r.assignedToId === u.id)
    const compRefs = refs.filter(r => r.status === 'Completed')
    const dmes = data.dmeOrders.filter(d => d.assignedToId === u.id)
    const pas = data.priorAuths.filter(p => p.assignedToId === u.id)
    const apps = data.appeals.filter(a => a.assignedToId === u.id)

    const row = staffSheet.addRow({
      name: u.name,
      role: u.title,
      refAssigned: refs.length,
      refCompleted: compRefs.length,
      refRate: refs.length ? `${((compRefs.length / refs.length) * 100).toFixed(0)}%` : 'N/A',
      dmeAssigned: dmes.length,
      dmeDelivered: dmes.filter((d: any) => d.status === 'Delivered').length,
      paAssigned: pas.length,
      paApproved: pas.filter((p: any) => p.status === 'Approved').length,
      appeals: apps.length
    })
    styleDataRow(row, i % 2 === 1)
  })

  // ── BURLESON DIRECTORY tab ──
  const dirSheet = wb.addWorksheet('Specialist Directory')
  dirSheet.columns = [
    { header: 'Name', key: 'name', width: 24 },
    { header: 'Specialty', key: 'specialty', width: 20 },
    { header: 'Practice', key: 'practice', width: 30 },
    { header: 'City', key: 'city', width: 14 },
    { header: 'Phone', key: 'phone', width: 16 },
    { header: 'Fax', key: 'fax', width: 16 },
    { header: 'NPI', key: 'npi', width: 14 },
    { header: 'Medicare', key: 'medicare', width: 12 },
    { header: 'Medicaid', key: 'medicaid', width: 12 },
    { header: 'Network', key: 'network', width: 35 },
    { header: 'Wait Time', key: 'waitTime', width: 14 },
    { header: 'Notes', key: 'notes', width: 40 }
  ]
  styleHeader(dirSheet.getRow(1))
  dirSheet.autoFilter = { from: 'A1', to: 'L1' }
  dirSheet.views = [{ state: 'frozen', ySplit: 1 }]

  data.specialists.forEach((s, i) => {
    const row = dirSheet.addRow({
      name: s.name,
      specialty: s.specialty,
      practice: s.practice,
      city: s.city,
      phone: s.phone,
      fax: s.fax,
      npi: s.npi,
      medicare: s.acceptMedicare ? 'YES' : 'NO',
      medicaid: s.acceptMedicaid ? 'YES' : 'NO',
      network: s.network,
      waitTime: s.waitTime,
      notes: s.notes
    })
    styleDataRow(row, i % 2 === 1)
  })

  // ── VENDOR DIRECTORY tab ──
  const vendSheet = wb.addWorksheet('Vendor Directory')
  vendSheet.columns = [
    { header: 'Vendor Name', key: 'name', width: 28 },
    { header: 'Category', key: 'category', width: 16 },
    { header: 'City', key: 'city', width: 14 },
    { header: 'Phone', key: 'phone', width: 16 },
    { header: 'Fax', key: 'fax', width: 16 },
    { header: 'Contact', key: 'contact', width: 20 },
    { header: 'Medicare', key: 'medicare', width: 12 },
    { header: 'Notes', key: 'notes', width: 40 }
  ]
  styleHeader(vendSheet.getRow(1))

  data.vendors.forEach((v, i) => {
    const row = vendSheet.addRow({
      name: v.name,
      category: v.category,
      city: v.city,
      phone: v.phone,
      fax: v.fax,
      contact: v.contact,
      medicare: v.acceptMedicare ? 'YES' : 'NO',
      notes: v.notes
    })
    styleDataRow(row, i % 2 === 1)
  })

  const buf = await wb.xlsx.writeBuffer()
  return Buffer.from(buf)
}
