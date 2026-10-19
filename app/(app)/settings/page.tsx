import { SettingsClient } from '@/components/settings/SettingsClient'

export const metadata = {
  title: 'Settings — NyayaTrace',
  description: 'System health, database stats, and AI provider configuration',
}

export default function SettingsPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-4xl mx-auto w-full">
      <SettingsClient />
    </div>
  )
}
