import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { LoggingExceptionFilter } from './common/filters/logging-exception.filter'
import { requestLogger } from './common/middleware/request-logger.middleware'

async function bootstrap() {
	const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn', 'debug', 'verbose'] })
	app.enableCors({ 
		origin: process.env.CORS_ORIGIN || true, 
		credentials: true 
	})
	app.use(requestLogger())
	app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }))
	app.useGlobalFilters(new LoggingExceptionFilter())
	
	// Add health check endpoint for production monitoring
	app.getHttpAdapter().get('/health', (req, res) => {
		res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
	})
	
	const port = Number(process.env.PORT || 3001)
	await app.listen(port)
	// eslint-disable-next-line no-console
	console.log(`sequence-be listening on http://localhost:${port}`)
}

bootstrap()


// http://localhost:3001/workflows/test-api?city={{city}}