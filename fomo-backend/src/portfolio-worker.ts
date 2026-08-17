import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { PortfolioWorkerModule } from './portfolio/portfolio-worker.module';
import { PortfolioWorkerHealthService } from './portfolio/portfolio-worker-health.service';

async function bootstrap() {
    const logger = new Logger('PortfolioWorker');
    const app = await NestFactory.createApplicationContext(PortfolioWorkerModule, {
        logger: ['log', 'error', 'warn', 'debug'],
    });
    await app.get(PortfolioWorkerHealthService).heartbeat();
    logger.log('Portfolio worker started');
}

bootstrap();
