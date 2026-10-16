import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Pool } from 'pg';
import { json, type Request, type Response, type NextFunction } from 'express';
import { Database, createPool } from './database';
import { HealthController, TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { HttpErrorFilter } from './http-error.filter';

export async function createApplication(pool?: Pool) {
  @Module({
    controllers: [TasksController, HealthController],
    providers: [TasksService, { provide: Database, useValue: new Database(pool ?? createPool()) }],
  })
  class AppModule {}

  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'], bodyParser: false });
  app.use((_request: Request, response: Response, next: NextFunction) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.removeHeader('X-Powered-By');
    next();
  });
  app.use(json({ limit: '32kb' }));
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new HttpErrorFilter());
  return app;
}
