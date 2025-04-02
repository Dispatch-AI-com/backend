import { DocumentBuilder } from '@nestjs/swagger';

export const getSwaggerConfig = () => {
  return new DocumentBuilder()
    .setTitle('Dispatch AI API')
    .setDescription('Dispatch AI API Documentation')
    .setVersion('0.0.1')
    .addBearerAuth()
    .build();
};