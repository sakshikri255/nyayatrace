import { AlertTriangle } from 'lucide-react'

/**
 * Non-dismissable legal disclaimer banner.
 * Must appear at the top of every bail brief page.
 * No close button — permanent.
 */
export function BailDisclaimer() {
  return (
    <div className="bg-amber-50 border border-amber-200 border-l-4 border-l-amber-500 rounded-md p-4">
      <div className="flex gap-3">
        <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
        <div>
          <p className="font-semibold text-amber-900 text-sm">Important Notice</p>
          <p className="text-amber-800 text-sm mt-1">
            This module organizes case and order records only. It does not constitute legal advice or determine bail or parole eligibility. Verify all information against the original documents.
          </p>
        </div>
      </div>
    </div>
  )
}
