import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`===================================================================`);
  logger.log(`🚀 NestJS PostgreSQL & GraphQL Playground running at: http://localhost:${port}`);
  logger.log(`🎯 Interactive GraphQL Playground: http://localhost:${port}/graphql`);
  logger.log(
    `🐘 PostgreSQL Host: ${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || 5433}`,
  );
  logger.log(`💾 PostgreSQL Database: ${process.env.POSTGRES_DB || 'nestjs_graphql_db'}`);
  logger.log(`===================================================================`);
}

bootstrap();
