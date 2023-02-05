import { hrtime } from 'process'

import { Context, Middleware, middlewareCall, Request } from '@curveball/core'
import { nanoid as getId } from 'nanoid/async'
import pino, { ChildLoggerOptions, Logger } from 'pino'


type nextFn = () => Readonly<Promise<void>>
export type LoggerContext = Context & {
  logger: Logger
  state: {
    id: string
  }
}

/* Re-usable logger */
const globalLogger = pino()

class PinoLogger {
  private readonly logger: Logger

  constructor (options: ChildLoggerOptions = {}) {
    this.logger = makeLogger('api', options)
  }

  async [middlewareCall] (ctx: Context, next: nextFn): Promise<void> {
    const start = hrtime.bigint()
    const id = await getId()

    const context = ctx as LoggerContext
    context.logger = this.logger.child({ id })
    ctx.state.id = id

    context.logger.info({
      ...serialiseRequest(ctx.request)
    }, 'request')

    await next()
    const end = hrtime.bigint()
    const responseTime = `${Number(end - start) * 0.000001}ms`
    context.logger.info({
      responseTime,
      ...serialiseResponse(ctx),
      ...serialiseRequest(ctx.request)
    }, 'response')
  }
}

/**
 * Main middleware function.
 *
 * @param options Logger options. Refer to pino docs.
 * @returns {Middleware} Curveball middleware.
 */
export function pinoLogger (options: ChildLoggerOptions = {}): Middleware {
  return new PinoLogger(options)
}

/**
 * Make a child logger.
 *
 * ### Example (commonjs)
 * ```js
 * const logger = makeLogger('database')
 * logger.info('Database connected!')
 * ```
 *
 * @param ns Namespace for the module using this logger instance.
 * @param options Logger options. Refer to pino docs.
 * @returns {Logger}
 */
export function makeLogger (ns: string, options: ChildLoggerOptions = {}): Logger {
  return globalLogger.child({ ns }, options)
}

/*
 * Request meta data. This plays nice with pino-colada
 */

type RequestLog = {
  req: {
    method: string
    url: string
  }
}

type ResponseLog = {
  contentLength: string | null
  res: {
    statusCode: number
  }
}

function serialiseRequest (req: Request): RequestLog {
  return {
    req: {
      method: req.method,
      url: req.path
    }
  }
}

function serialiseResponse (ctx: Context): ResponseLog {
  return {
    contentLength: ctx.response.headers.get('Content-Length'),
    res: {
      statusCode: ctx.response.status
    }
  }
}
