import { setHeader } from 'h3'
import { issueCsrfToken } from '../../utils/csrf'

export default defineEventHandler((event) => {
  setHeader(event, 'cache-control', 'no-store')
  return { csrfToken: issueCsrfToken(event) }
})
