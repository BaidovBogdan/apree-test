import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { createTaskSchema, deleteTaskSchema, updateTaskSchema } from '@apree/contracts';
import type { ZodType } from '@apree/contracts';
import { TasksService } from './tasks.service';
import { Database } from './database';

function parse<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) throw new BadRequestException('Некорректные данные задачи');
  return result.data;
}

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  list() { return this.tasks.list(); }

  @Get(':id')
  find(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) { return this.tasks.find(id); }

  @Post()
  create(@Body() body: unknown) { return this.tasks.create(parse(createTaskSchema, body)); }

  @Patch(':id')
  update(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() body: unknown) {
    return this.tasks.update(id, parse(updateTaskSchema, body));
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() body: unknown) {
    return this.tasks.remove(id, parse(deleteTaskSchema, body).version);
  }
}

@Controller('health')
export class HealthController {
  constructor(private readonly database: Database) {}

  @Get()
  async health() {
    await this.database.pool.query('SELECT 1 FROM tasks LIMIT 0');
    return { status: 'ok' };
  }
}
