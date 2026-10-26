import { SettingsClient } from '@/components/settings/SettingsClient'

export const metadata = {
  title: 'Settings — NyayaSetu',
  description: 'Profile settings and court diary',
}

export default function SettingsPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-5xl mx-auto w-full">
      <SettingsClient />
    </div>
  )
}
