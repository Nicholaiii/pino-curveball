import Application, { Context, MemoryRequest, MemoryResponse, middlewareCall } from '@curveball/core'
import test from 'ava'
import getPort from 'get-port'
import got from 'got'

import { makeLogger, pinoLogger, PinoLogger } from './logger'


test('makeLogger', async (t) => {
  t.plan(2)

  const logger = makeLogger('test')
  t.truthy(logger.version)
  logger.on('level-change', t.pass)
  logger.level = 'info'
})

test('pinoLogger', async (t) => {
  /* Plan for three assertions:
   * Testing that the logger is truthy, and request+response log.
   */
  t.plan(3)

  const port = await getPort()
  const logger = pinoLogger({
    formatters: {
      log: () => {
        t.pass()
        return {}
      }
    }
  })

  t.truthy(logger)

  const app = new Application()
  app.use(logger)
  app.use(ctx => { ctx.response.body = 'Okay' })
  app.listen(port)

  await got(`http://localhost:${port}`)
})

test('PinoLogger', async (t) => {
  t.plan(4)

  const instance = new PinoLogger({
    formatters: {
      log: () => {
        t.pass()
        return {}
      }
    }
  })

  t.truthy(instance['logger'])

  const ctx = new Context(
    new MemoryRequest('POST', '/', 'localhost'),
    new MemoryResponse('localhost')
  )

  /*
   * This is to assert that next is always called,
   * making mw not hang up the request
   */
  const next = async () => void t.pass()
  await instance[middlewareCall](ctx, next)
})
