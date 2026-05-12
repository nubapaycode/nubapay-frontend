# Tenant / Marca blanca — checklist (frontend + backend)

## Objetivo
Que el sistema multi-tenant sea consistente por **host/dominio**, con branding correcto (logo/colores/favicon/SEO) y, sobre todo, con **aislamiento de datos y permisos** correcto.

---

## 1) Resolución de tenant por host (backend)
- [ ] `X-Branded-Host` debe tomarse del request real (Host / X-Forwarded-Host) y normalizarse (sin puerto).
- [ ] `resolve_tenant_for_host()` debe cubrir:
  - [ ] host plataforma (apex, `www`, `localhost`, previews) → tenant plataforma
  - [ ] dominios verificados (`TenantDomain.verified_at`) → tenant correspondiente
  - [ ] subdominio `*.NUBAPAY_ROOT_DOMAIN` → tenant por `subdomain`
- [ ] Si el host no matchea ningún tenant (y no es plataforma), decidir criterio:
  - [ ] `404`/error explícito, o
  - [ ] fallthrough a plataforma (no recomendado para dominios dedicados).

## 2) Seguridad: spoofing de `X-Branded-Host`
- [ ] El proxy de Next (`/api/backend/*`) NO debe aceptar un `X-Branded-Host` arbitrario enviado por el browser.
  - [ ] Recomendado: siempre setear `X-Branded-Host` desde `Host`/`X-Forwarded-Host` en el edge/proxy.
  - [ ] Si el SSR necesita pasar host “original”, usar un header interno distinto y validarlo (no exponerlo a cliente).
- [ ] CORS: evitar permitir headers que habiliten spoofing desde orígenes no confiables.

## 3) Identidad: cuentas globales vs aisladas por tenant
Si se mantiene identidad global (un user/email para toda la plataforma):
- [ ] En dominios dedicados, enforcear que el usuario tenga vínculo con ese tenant:
  - [ ] al login, o
  - [ ] al validar token, o
  - [ ] en cada endpoint que lea/escriba datos.
- [ ] Modelar explícitamente relación usuario↔tenant si aplica multi-tenant real (membresías por tenant).

Si se aísla por tenant (cuentas separadas):
- [ ] `users` debe estar scopiado por tenant (email único por tenant, no global).
- [ ] UX: mecanismo de “switch tenant” o cuentas separadas.

## 4) Payload público de theme / branding
- [ ] Definir contrato de `/public/tenant-by-host`:
  - [ ] `inherit` (modo plataforma vs branding)
  - [ ] `dedicated_partner_host` (host resolvió tenant distinto de plataforma)
  - [ ] `resolved_subdomain`
  - [ ] `branding` (displayName, logoUrl, faviconUrl, primaryColor, secondaryColor, seoDescription, seoTitleSuffix, accentContrastText)
- [ ] Para host dedicado verificado: decidir si `inherit=true` es válido o no.
  - [ ] Recomendado: host dedicado ⇒ branding mínimo siempre.

## 5) Aplicación de branding (frontend)
- [ ] Layout comprador (`/catalogo/*`):
  - [ ] CSS vars `--buyer-accent` / `--buyer-accent-text`
  - [ ] metadatos: title, description, favicon, themeColor, OG/Twitter
- [ ] Layout organizador (`/events/*`, `/login`, `/register`):
  - [ ] CSS vars `--organizer-accent` / `--organizer-accent-ink`
  - [ ] logo/displayName donde haya “nubapay” hardcodeado
  - [ ] botones y UI acentuada usando variables (no hex fijo)

## 6) Consistencia visual “herramienta por herramienta” (organizer)
- [ ] `Dashboard`
- [ ] `Storefront`
- [ ] `Products`
- [ ] `Scanner`
- [ ] `Orders`
- [ ] `Pickup points`
- [ ] `Payments`
- [ ] `Staff`
- [ ] `Brand`

Para cada herramienta:
- [ ] CTA principal usa acento del tenant (`--organizer-accent`)
- [ ] estados activos/selección (tabs, pills) usan acento del tenant
- [ ] contrast (texto/iconos) usa `--organizer-accent-ink`

## 7) Observabilidad / debugging
- [ ] Flag `NUBAPAY_DEBUG_TENANT_HOST` / `NEXT_PUBLIC_DEBUG_TENANT_THEME` loguea host→tenant→inherit de forma clara.
- [ ] Alertas cuando `X-Branded-Host` llega vacío en producción.

