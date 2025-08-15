import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const databaseName = process.env.DATABASE_NAME;
  const dataBasePass = process.env.DATABASE_PASS;
  const dataBaseUser = process.env.DATABASE_USER;
  const HOST = process.env.DATABASE_HOST;
  const PORT = process.env.DATABASE_PORT;
  const port = process.env.APP_PORT;

  console.log({ databaseName, dataBasePass, dataBaseUser, HOST, PORT, port });

  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('GTower Customers API')
    .setDescription('API for managing customer data')
    .setVersion('1.0')
    .addTag('customers', 'Customer management operations')
    .addTag('call-logs', 'Call log management operations')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [],
  });
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
  app.setGlobalPrefix('rest');
  await app.listen(port);
}
bootstrap();
