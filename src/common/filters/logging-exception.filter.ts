import { ArgumentsHost, Catch, HttpException, Logger } from '@nestjs/common'
import { BaseExceptionFilter } from '@nestjs/core'

@Catch()
export class LoggingExceptionFilter extends BaseExceptionFilter {
	private readonly logger = new Logger(LoggingExceptionFilter.name)

	override catch(exception: unknown, host: ArgumentsHost) {
		try {
			if (exception instanceof HttpException) {
				const res = exception.getResponse()
				this.logger.error(`HTTP ${exception.getStatus()} - ${JSON.stringify(res)}`)
			} else if (exception instanceof Error) {
				this.logger.error(exception.message, exception.stack)
			} else {
				this.logger.error(String(exception))
			}
		} catch (loggingError) {
			// Fallback logging if there's an error in the logging process
			this.logger.error('Exception occurred but logging failed', loggingError)
		}
		
		// Safely call parent method with additional error handling
		try {
			super.catch(exception, host)
		} catch (filterError) {
			// If the parent filter fails, try to send a basic error response
			this.logger.error('Base exception filter failed', filterError)
			
			try {
				const ctx = host.switchToHttp()
				const response = ctx.getResponse()
				
				if (response && typeof response.status === 'function' && !response.headersSent) {
					const status = exception instanceof HttpException ? exception.getStatus() : 500
					const message = exception instanceof HttpException 
						? exception.getResponse() 
						: { message: 'Internal server error' }
					
					response.status(status).json(message)
				}
			} catch (responseError) {
				this.logger.error('Failed to send error response', responseError)
			}
		}
	}
} 