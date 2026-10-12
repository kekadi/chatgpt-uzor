import { Header } from '@/components/layout/Header'
import { BookOpen, AlertTriangle, Clock, CheckCircle2, ArrowRight, Phone, FileText } from 'lucide-react'

export default function SOPPage() {
  return (
    <div>
      <Header title="SOP & Policy Reference" />
      <div className="p-6 max-w-5xl space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-brand-900 to-brand-700 text-white rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-6 h-6 text-brand-200" />
            <h2 className="text-xl font-bold">Standard Operating Procedures</h2>
          </div>
          <p className="text-brand-200 text-sm">Burleson Geriatric Primary Care — Referral, DME & Prior Authorization Framework</p>
          <p className="text-brand-300 text-xs mt-1">Effective Date: January 2024 · Review: Annually · HIPAA Compliant</p>
        </div>

        {/* Aging Standards */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Clock className="w-4 h-4 text-brand-600" /> Aging Standards & Escalation Thresholds</h3>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {[
                { urgency: 'STAT', green: '< 1 day', yellow: '1 day', red: '2+ days', bg: 'bg-red-50 border-red-200' },
                { urgency: 'Urgent', green: '< 4 days', yellow: '4–7 days', red: '7+ days', bg: 'bg-orange-50 border-orange-200' },
                { urgency: 'Routine', green: '< 7 days', yellow: '7–14 days', red: '14+ days', bg: 'bg-blue-50 border-blue-200' }
              ].map(u => (
                <div key={u.urgency} className={`rounded-xl border p-4 ${u.bg}`}>
                  <div className="font-bold text-gray-800 mb-3">{u.urgency} Referrals/Orders</div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm"><span className="w-3 h-3 rounded-full bg-green-500 shrink-0"></span><span className="text-gray-700">On Track: {u.green}</span></div>
                    <div className="flex items-center gap-2 text-sm"><span className="w-3 h-3 rounded-full bg-yellow-400 shrink-0"></span><span className="text-gray-700">Aging: {u.yellow}</span></div>
                    <div className="flex items-center gap-2 text-sm"><span className="w-3 h-3 rounded-full bg-red-500 shrink-0"></span><span className="text-gray-700">Overdue: {u.red}</span></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Escalation Matrix */}
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Escalation Matrix</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-brand-900 text-white">
                  <tr>
                    {['Trigger','Time Frame','Action Required','Responsible Party','Notification'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    ['🟡 Aging — Routine', 'Day 7', 'Follow up with specialist office/vendor', 'Assigned Coordinator', 'Flag in CRM'],
                    ['🟡 Aging — Urgent', 'Day 4', 'Phone follow-up + document', 'Assigned Coordinator', 'Email supervisor'],
                    ['🔴 Overdue — Routine', 'Day 14', 'Escalate to supervisor + patient contact', 'Supervisor', 'Supervisor notified'],
                    ['🔴 Overdue — Urgent', 'Day 7', 'Same-day resolution or physician notification', 'Supervisor + MD', 'Physician alert'],
                    ['PA Denial', 'Within 24h', 'Review denial, initiate P2P or appeal', 'Coordinator + Supervisor', 'Physician review'],
                    ['P2P Scheduled', '48h prior', 'Prepare clinical summary for physician', 'Coordinator', 'Reminder to MD'],
                    ['Auth Expiring', '30 days prior', 'Request extension or reauthorize', 'Coordinator', 'CRM alert'],
                    ['STAT Request', 'Same day', 'Process within 4 business hours', 'Lead Coordinator', 'Immediate call']
                  ].map(([trigger, timeframe, action, responsible, notification], i) => (
                    <tr key={i} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                      <td className="px-4 py-3 font-medium text-gray-800">{trigger}</td>
                      <td className="px-4 py-3 text-gray-700">{timeframe}</td>
                      <td className="px-4 py-3 text-gray-700">{action}</td>
                      <td className="px-4 py-3 text-gray-700">{responsible}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{notification}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* KPI Targets */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> KPI Performance Targets</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { kpi: 'Referral Processing Time (Routine)', target: '≤ 5 business days to send', threshold: '> 10 days = urgent review' },
              { kpi: 'Referral Processing Time (Urgent)', target: '≤ 48 hours to send', threshold: '> 72 hours = escalate' },
              { kpi: 'PA Submission Turnaround', target: '≤ 48 hours from order', threshold: '> 5 days = supervisor review' },
              { kpi: 'PA Approval Rate', target: '≥ 85%', threshold: '< 70% = process review' },
              { kpi: 'PA Denial Rate', target: '≤ 15%', threshold: '> 20% = payer analysis' },
              { kpi: 'DME Delivery Time', target: '≤ 7 business days', threshold: '> 14 days = vendor escalation' },
              { kpi: 'P2P Win Rate', target: '≥ 60%', threshold: '< 40% = clinical review' },
              { kpi: 'Documentation Completion', target: '100% within 24h of action', threshold: 'Any gap = training review' },
              { kpi: 'Patient Contact on Denial', target: '≤ 24 hours after denial', threshold: 'Same-day for STAT' },
              { kpi: 'Auth Expiration Rate', target: '0 expired auths in use', threshold: 'Any expiration = immediate action' }
            ].map(k => (
              <div key={k.kpi} className="border border-gray-200 rounded-lg p-3">
                <div className="font-medium text-gray-800 text-sm mb-1">{k.kpi}</div>
                <div className="flex gap-3 text-xs">
                  <span className="text-green-600 flex-1">✅ Target: {k.target}</span>
                  <span className="text-red-600 flex-1">⚠️ {k.threshold}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Workflow */}
        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              title: 'Referral Workflow',
              color: 'bg-blue-50 border-blue-200',
              steps: [
                'Provider orders referral in eClinicalWorks',
                'Coordinator reviews order within 24h',
                'Check insurance & auth requirements',
                'Obtain prior auth if required',
                'Fax/submit to specialist office',
                'Confirm receipt within 48h',
                'Schedule appointment (if applicable)',
                'Document all milestones in CRM',
                'Follow up 7 days if no scheduling',
                'Close when attended + notes received'
              ]
            },
            {
              title: 'DME Order Workflow',
              color: 'bg-emerald-50 border-emerald-200',
              steps: [
                'Provider creates DME order in eCW',
                'Verify medical necessity documentation',
                'Check CMS coverage criteria (LCDs)',
                'Identify network vendor',
                'Submit prior auth if required',
                'Issue order to vendor with documentation',
                'Confirm order acknowledgment',
                'Track delivery — follow up at 5 days',
                'Document delivery date in CRM',
                'Patient follow-up for education/fit'
              ]
            },
            {
              title: 'Prior Auth Workflow',
              color: 'bg-purple-50 border-purple-200',
              steps: [
                'Identify auth requirement via payer guide',
                'Gather supporting clinical documentation',
                'Submit to payer (portal/fax/phone)',
                'Document submission date & tracking #',
                'Follow up at 72h if no response',
                'If approved: document auth# + expiration',
                'If denied: review denial reason same day',
                'Initiate P2P review within 24h of denial',
                'Escalate to physician for P2P call',
                'Document outcome; appeal if upheld'
              ]
            }
          ].map(w => (
            <div key={w.title} className={`border rounded-xl p-5 ${w.color}`}>
              <h4 className="font-semibold text-gray-800 mb-3">{w.title}</h4>
              <ol className="space-y-1.5">
                {w.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                    <span className="w-4 h-4 rounded-full bg-white border border-gray-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        {/* Staff Job Aids */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-brand-600" /> Quick Reference — Staff Job Aids</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: 'CMS Medicare PA Requirements', items: ['Power wheelchairs (all groups): PA required', 'CPAP: 84-day compliance data required', 'CGM: insulin-dependent criteria', 'Hospital beds: documentation criteria', 'Oxygen: sleep study or PFT results required'] },
              { title: 'Common Denial Codes', items: ['CO-50: Not medically necessary', 'CO-96: Non-covered charge(s)', 'PR-96: Patient responsible', 'CO-4: Incorrect billing code', 'CO-23: Coordination of benefits', 'CO-197: Pre-authorization required'] },
              { title: 'P2P Best Practices', items: ['Have clinical documentation ready before call', 'Cite specific clinical criteria met', 'Present objective data (labs, vitals, imaging)', 'Document physician name and reference #', 'Request call recording if possible', 'Follow up in writing within 24h'] },
              { title: 'HIPAA Compliance Reminders', items: ['Only access patient data with need to know', 'Do not email PHI without encryption', 'Log all patient data access (auto in CRM)', 'Report breaches within 60 days', 'Dispose of PHI per retention policy', 'Annual training required (HIPAA + 42 CFR)'] }
            ].map(section => (
              <div key={section.title} className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-semibold text-gray-800 text-sm mb-2">{section.title}</h5>
                <ul className="space-y-1">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                      <ArrowRight className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency contacts */}
        <div className="bg-brand-900 text-white rounded-xl p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Phone className="w-4 h-4" /> Key Contacts — Burleson Geriatric Primary Care</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            {[
              { title: 'Practice Address', lines: ['100 SW Wilshire Blvd', 'Burleson, TX 76028', 'NPI: 1234567890'] },
              { title: 'Medicare Contact', lines: ['Provider Relations: 1-800-MEDICARE', 'Claims: 1-877-567-7271', 'PA Portal: www.medicare.gov'] },
              { title: 'After-Hours Escalation', lines: ['Supervisor: (817) 555-0200', 'Practice Manager: (817) 555-0201', 'STAT orders: page on-call MD'] }
            ].map(c => (
              <div key={c.title}>
                <div className="font-medium text-brand-200 text-xs uppercase tracking-wide mb-1">{c.title}</div>
                {c.lines.map((l, i) => <div key={i} className="text-brand-100 text-xs">{l}</div>)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
