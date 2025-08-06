import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const databaseName = process.env.DATABASE_NAME;
  const dataBasePass = process.env.DATABASE_PASS;
  const dataBaseUser = process.env.DATABASE_USER;
  const HOST = process.env.DATABASE_HOST;
  const PORT = process.env.DATABASE_PORT;
  const port = process.env.APP_PORT;

  console.log({ databaseName, dataBasePass, dataBaseUser, HOST, PORT, port });

  const app = await NestFactory.create(AppModule);

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('GTower Customers API')
    .setDescription('API for managing customer data')
    .setVersion('1.0')
    .addTag('customers')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(port);
}
bootstrap();
