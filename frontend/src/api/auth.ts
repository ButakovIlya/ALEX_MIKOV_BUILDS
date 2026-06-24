export const ADMIN_AUTH_EXPIRED_EVENT = 'admin-auth-expired'

export function expireAdminSession() {
  localStorage.removeItem('admin_token')
  window.dispatchEvent(new Event(ADMIN_AUTH_EXPIRED_EVENT))
}

export function expireAdminSessionOnUnauthorized(status: number) {
  if ((status === 401 || status === 403) && localStorage.getItem('admin_token')) {
    expireAdminSession()
  }
}
