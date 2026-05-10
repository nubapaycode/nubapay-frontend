import { TenantThemeDevLog } from '@/components/catalog/TenantThemeDevLog'
import { fetchTenantThemeForRequest } from '@/lib/fetchTenantTheme'
import { TENANT_BUYER_ACCENT_VAR_DEFAULTS, brandingAccentVars } from '@/lib/tenantThemeAccentVars'

export default async function CatalogoLayout({ children }: { children: React.ReactNode }) {
  const theme = await fetchTenantThemeForRequest()
  const branded = brandingAccentVars(theme)
  const style = { ...TENANT_BUYER_ACCENT_VAR_DEFAULTS, ...branded }
  return (
    <div className="catalog-tenant-scope min-h-dvh" style={style}>
      {process.env.NEXT_PUBLIC_DEBUG_TENANT_THEME === '1' && <TenantThemeDevLog theme={theme} />}
      {children}
    </div>
  )
}
