import Application from '@curveball/core'
import test from 'ava'
import getPort from 'get-port'
import got from 'got'

import { makeLogger, pinoLogger } from './logger'

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
