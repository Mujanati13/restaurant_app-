import { serverTenant } from '../../utils/tenant'

export default defineEventHandler(async (event): Promise<any[]> => {
  const tenant: any = (await serverTenant(event)).data
  const android: any = tenant.brand.mobile?.android || {}
  return android.package_name && android.sha256_cert_fingerprints?.length ? [{ relation: ['delegate_permission/common.handle_all_urls'],
    target: { namespace: 'android_app', package_name: android.package_name, sha256_cert_fingerprints: android.sha256_cert_fingerprints } }] : []
})
