// src/setup-swagger.ts
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Dispatch AI API')
    .setDescription('Voice-based assistant API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Swagger UI
  SwaggerModule.setup('docs', app, document, {
    useGlobalPrefix: true,
    customSiteTitle: 'Dispatch AI Swagger',
  });

  // Redoc UI
  const redocHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Dispatch AI API - Redoc</title>
        <meta charset="utf-8" />
        <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
      </head>
      <body>
        <redoc spec-url="/api/docs-json"></redoc>
      </body>
    </html>
  `;

  app.getHttpAdapter().get('/api/redoc', (req, res) => {
    res.type('html').send(redocHtml);
  });
}
