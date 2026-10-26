import type { CaseBriefData } from '@/components/reports/CaseBriefView'

export function exportCourtDocx(data: CaseBriefData) {
  const courtName = data.case.court || 'THE COURT OF DISTRICT & SESSIONS JUDGE'
  const caseNumber = data.case.caseNumber
  const caseTitle = data.case.title
  const dateFormatted = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const findingsHtml = data.findings.list
    .map(
      (f, i) => `
    <tr>
      <td style="border: 1px solid #333; padding: 6px; font-size: 11pt;">${i + 1}</td>
      <td style="border: 1px solid #333; padding: 6px; font-size: 11pt;"><strong>${f.findingType.replace(/_/g, ' ').toUpperCase()}</strong></td>
      <td style="border: 1px solid #333; padding: 6px; font-size: 11pt;">${f.description}</td>
      <td style="border: 1px solid #333; padding: 6px; font-size: 11pt;">Record 1: "${f.extractedValue || '—'}"<br/>Record 2: "${f.comparisonValue || '—'}"</td>
      <td style="border: 1px solid #333; padding: 6px; font-size: 11pt; text-transform: uppercase;"><strong>${f.severity}</strong></td>
    </tr>`
    )
    .join('')

  const hearingsHtml = data.hearings.list
    .map(
      (h) => `
    <tr>
      <td style="border: 1px solid #333; padding: 6px; font-size: 11pt;">${h.hearingDate}</td>
      <td style="border: 1px solid #333; padding: 6px; font-size: 11pt;">${h.eventType.replace(/_/g, ' ').toUpperCase()}</td>
      <td style="border: 1px solid #333; padding: 6px; font-size: 11pt;">${h.outcome || h.description || '—'}</td>
      <td style="border: 1px solid #333; padding: 6px; font-size: 11pt;">${h.judge || '—'}</td>
    </tr>`
    )
    .join('')

  const wordDocumentHtml = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <meta charset="utf-8">
    <title>Court Brief - ${caseNumber}</title>
    <!--[if gte mso 9]>
    <xml>
      <w:WordDocument>
        <w:View>Print</w:View>
        <w:Zoom>100</w:Zoom>
        <w:DoNotOptimizeForBrowser/>
      </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
      @page {
        size: A4;
        margin: 1.5in 1.0in 1.0in 1.25in;
        mso-header-margin: .5in;
        mso-footer-margin: .5in;
      }
      body {
        font-family: 'Times New Roman', Times, serif;
        font-size: 12pt;
        line-height: 1.5;
        color: #000;
      }
      h1, h2, h3 {
        text-align: center;
        font-weight: bold;
        text-transform: uppercase;
        margin-bottom: 0.2in;
      }
      h1 { font-size: 14pt; }
      h2 { font-size: 12pt; }
      .cause-title {
        text-align: center;
        margin-top: 0.3in;
        margin-bottom: 0.3in;
      }
      .table-data {
        width: 100%;
        border-collapse: collapse;
        margin-top: 0.2in;
        margin-bottom: 0.2in;
      }
      .page-break {
        page-break-before: always;
      }
    </style>
  </head>
  <body>
    <h1>IN ${courtName}</h1>
    <h2>CASE RECORD &amp; SYNOPSIS OF FACTS</h2>
    <p style="text-align: center; font-weight: bold;">CASE NO: ${caseNumber}</p>

    <div class="cause-title">
      <p style="font-weight: bold; margin-bottom: 0.1in;">IN THE MATTER OF:</p>
      <p style="font-size: 13pt; font-weight: bold;">${caseTitle.toUpperCase()}</p>
      <p style="text-align: right; margin-right: 0.5in; font-style: italic;">... APPLICANT / ACCUSED</p>
      <p style="text-align: center; font-weight: bold;">VERSUS</p>
      <p style="font-size: 13pt; font-weight: bold;">STATE / PROSECUTION</p>
      <p style="text-align: right; margin-right: 0.5in; font-style: italic;">... RESPONDENT</p>
    </div>

    <hr style="border-top: 2px solid #000; margin: 0.2in 0;" />

    <h3>I. SYNOPSIS &amp; BACKGROUND OF RECORD</h3>
    <p style="text-align: justify; text-indent: 0.5in;">
      ${data.case.description || 'The present case arises out of the case records and exhibits reviewed under NyayaSetu workstation.'}
    </p>
    <p style="text-align: justify; text-indent: 0.5in;">
      The record contains a total of <strong>${data.documents.count}</strong> authorized exhibits/documents. Cross-referencing has yielded <strong>${data.findings.total}</strong> material evidentiary observations, of which <strong>${data.findings.verified}</strong> have been verified by counsel/reviewers.
    </p>

    <h3>II. STATUTORY &amp; PROCEDURAL SAFEGUARDS</h3>
    <p style="text-align: justify; text-indent: 0.5in;">
      The applicant specifically invokes the statutory guarantees under <strong>Section 167(2) of the Code of Criminal Procedure, 1973 (CrPC) / Section 187 of the Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)</strong> safeguarding the indefeasible fundamental right to personal liberty under Article 21 of the Constitution of India.
    </p>

    <div class="page-break"></div>

    <h3>III. TABLE OF MATERIAL CONTRADICTIONS &amp; INCONSISTENCIES</h3>
    <p style="font-size: 10.5pt; font-style: italic; margin-bottom: 0.1in;">
      (Derived via exact multi-document cross-examination of witness statements, FIR, and seizure records)
    </p>
    <table class="table-data">
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th style="border: 1px solid #333; padding: 6px; width: 5%;">#</th>
          <th style="border: 1px solid #333; padding: 6px; width: 20%;">Finding Type</th>
          <th style="border: 1px solid #333; padding: 6px; width: 40%;">Description of Discrepancy</th>
          <th style="border: 1px solid #333; padding: 6px; width: 25%;">Extracted Record Comparison</th>
          <th style="border: 1px solid #333; padding: 6px; width: 10%;">Severity</th>
        </tr>
      </thead>
      <tbody>
        ${findingsHtml || '<tr><td colspan="5" style="border: 1px solid #333; padding: 8px; text-align: center;">No discrepancy records found.</td></tr>'}
      </tbody>
    </table>

    <div class="page-break"></div>

    <h3>IV. CHRONOLOGICAL LIST OF DATES AND HEARINGS</h3>
    <table class="table-data">
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th style="border: 1px solid #333; padding: 6px; width: 18%;">Hearing Date</th>
          <th style="border: 1px solid #333; padding: 6px; width: 22%;">Event / Stage</th>
          <th style="border: 1px solid #333; padding: 6px; width: 40%;">Procedural Outcome / Remarks</th>
          <th style="border: 1px solid #333; padding: 6px; width: 20%;">Coram / Presiding Judge</th>
        </tr>
      </thead>
      <tbody>
        ${hearingsHtml || '<tr><td colspan="4" style="border: 1px solid #333; padding: 8px; text-align: center;">No hearing dates recorded.</td></tr>'}
      </tbody>
    </table>

    <h3>V. FORMAL PRAYER</h3>
    <p style="text-align: justify; text-indent: 0.5in;">
      In light of the verified evidentiary contradictions, lack of flight risk, and statutory compliance, it is most respectfully prayed that this Hon'ble Court may graciously be pleased to:
    </p>
    <p style="margin-left: 0.5in;">
      (a) Release the Applicant on regular / default bail upon such reasonable terms and conditions as this Hon'ble Court may deem fit and proper;<br/>
      (b) Pass any other order(s) as this Hon'ble Court may deem fit in the interest of justice.
    </p>

    <div style="margin-top: 0.8in; display: flex; justify-content: space-between;">
      <div>
        <p><strong>Place:</strong> ___________________</p>
        <p><strong>Date:</strong> ${dateFormatted}</p>
      </div>
      <div style="text-align: right; margin-top: 0.4in;">
        <p>___________________________________</p>
        <p><strong>ADVOCATE FOR THE APPLICANT</strong></p>
      </div>
    </div>
  </body>
  </html>
  `

  const blob = new Blob([wordDocumentHtml], {
    type: 'application/msword;charset=utf-8',
  })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Court_Brief_${caseNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.doc`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
