import { ArgumentsHost, Catch, HttpException, Logger } from '@nestjs/common'
import { BaseExceptionFilter } from '@nestjs/core'

@Catch()
export class LoggingExceptionFilter extends BaseExceptionFilter {
	private readonly logger = new Logger(LoggingExceptionFilter.name)

	override catch(exception: unknown, host: ArgumentsHost) {
		if (exception instanceof HttpException) {
			const res = exception.getResponse()
			this.logger.error(`HTTP ${exception.getStatus()} - ${JSON.stringify(res)}`)
		} else if (exception instanceof Error) {
			this.logger.error(exception.message, exception.stack)
		} else {
			this.logger.error(String(exception))
		}
		super.catch(exception, host)
	}
} 