import { randomBytes, timingSafeEqual } from 'node:crypto'
import { createError, getCookie, getHeader, setCookie } from 'h3'

const COOKIE_NAME = 'csrf_token'
const TOKEN_LIFETIME_SECONDS = 24 * 60 * 60

function newToken() {
  return randomBytes(32).toString('base64url')
}

export function setCsrfToken(event: Parameters<typeof setCookie>[0], token = newToken()) {
  setCookie(event, COOKIE_NAME, token, {
    httpOnly: true,
    secure:
      process.env.COOKIE_SECURE === 'true' ||
      (process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'false'),
    sameSite: 'strict',
    path: '/',
    maxAge: TOKEN_LIFETIME_SECONDS,
  })
  return token
}

export function issueCsrfToken(event: Parameters<typeof setCookie>[0]) {
  return getCookie(event, COOKIE_NAME) ?? setCsrfToken(event)
}

export function verifyCsrfRequest(event: Parameters<typeof setCookie>[0]) {
  const config = useRuntimeConfig(event)
  const expectedOrigin = String(config.frontendOrigin).replace(/\/$/, '')
  const origin = getHeader(event, 'origin')
  const cookieToken = getCookie(event, COOKIE_NAME)
  const headerToken = getHeader(event, 'x-csrf-token')

  if (!origin || origin !== expectedOrigin || !cookieToken || !headerToken) {
    throw createError({ statusCode: 403, statusMessage: 'Solicitud CSRF inválida' })
  }

  const cookieBuffer = Buffer.from(cookieToken)
  const headerBuffer = Buffer.from(headerToken)
  if (cookieBuffer.length !== headerBuffer.length || !timingSafeEqual(cookieBuffer, headerBuffer)) {
    throw createError({ statusCode: 403, statusMessage: 'Solicitud CSRF inválida' })
  }
}
