//src/main.ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "@/modules/app.module";
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe());

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? "*",
  });

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
}
void bootstrap();
