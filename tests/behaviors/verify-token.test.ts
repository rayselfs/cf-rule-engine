import { createHmac } from 'crypto'
import { describe, it, expect } from 'vitest'
import { verifyToken } from '../../src/behaviors/verify-token.js'
import type { HttpRequest } from '../../src/core/types.js'

const key = '3d6b4f79465437fc25e8a88f94d7e0f9d54f37679534989fdf61654b425e7d87'

function sign(message: string): string {
  return createHmac('sha256', Buffer.from(key, 'hex')).update(message).digest('hex')
}

function token(message: string): string {
  return message + '~hmac=' + sign(message)
}

function request(uri: string, hdnts: string): HttpRequest {
  return {
    uri,
    method: 'GET',
    protocol: 'https',
    querystring: { hdnts: { value: hdnts }, ignored: { value: '1' } },
    headers: {},
    clientIp: '1.2.3.4',
  }
}

describe('verifyToken', () => {
  it('allows an ACL token for the requested path', () => {
    const fn = verifyToken({ key, escapeEarly: true, ignoreQueryString: true })
    const result = fn(request('/avatars/me 1.png', token('exp=4102444800~acl=/avatars/*')))

    expect(result.action).toBe('continue')
  })

  it('denies an ACL token used on a different path', () => {
    const fn = verifyToken({ key, escapeEarly: true, ignoreQueryString: true })
    const result = fn(request('/private/me.png', token('exp=4102444800~acl=/avatars/*')))

    expect(result.action).toBe('respond')
  })

  it('allows a URL token signed for the requested path', () => {
    const fn = verifyToken({ key, escapeEarly: true, ignoreQueryString: true })
    const result = fn(request('/avatars/me 1.png', 'exp=4102444800~hmac=' + sign('exp=4102444800~url=%2favatars%2fme+1.png')))

    expect(result.action).toBe('continue')
  })
})
