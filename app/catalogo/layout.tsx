import { TenantThemeDevLog } from '@/components/catalog/TenantThemeDevLog'
import { brandingAccentVars, fetchTenantThemeForRequest } from '@/lib/fetchTenantTheme'

export default async function CatalogoLayout({ children }: { children: React.ReactNode }) {
  const theme = await fetchTenantThemeForRequest()
  const vars = brandingAccentVars(theme)
  return (
    <div className="catalog-tenant-scope min-h-dvh" style={vars}>
      {process.env.NEXT_PUBLIC_DEBUG_TENANT_THEME === '1' && <TenantThemeDevLog theme={theme} />}
      {children}
    </div>
  )
}
