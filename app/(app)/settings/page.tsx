import { PageTransition } from '@/components/layout/PageTransition'

export default function SettingsPage() {
  return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
        <div className="w-12 h-0.5 bg-teal mb-6 rounded-full" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-sm text-gray-500 max-w-sm">
          This application stores records locally in SQLite and uploaded files in the project’s private uploads directory. It has no login or multi-user access control; use only public records or files you are authorized to process.
        </p>
      </div>
    </PageTransition>
  )
}
