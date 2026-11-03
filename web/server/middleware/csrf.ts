import { getMethod, getRequestURL } from 'h3'
import { verifyCsrfRequest } from '../utils/csrf'

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export default defineEventHandler((event) => {
  const pathname = getRequestURL(event).pathname
  if (pathname.startsWith('/api/') && unsafeMethods.has(getMethod(event))) {
    verifyCsrfRequest(event)
  }
})
