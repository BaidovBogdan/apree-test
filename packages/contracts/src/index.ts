import { z } from 'zod';
export type { ZodType } from 'zod';

export const statuses = ['new', 'in_progress', 'done'] as const;
export const priorities = ['low', 'medium', 'high'] as const;
export const statusSchema = z.enum(statuses);
export const prioritySchema = z.enum(priorities);
const titleSchema = z.string().trim().min(1).max(160).refine((value) => !value.includes('\u0000'), 'NUL is not supported');
const descriptionSchema = z.string().max(5000).refine((value) => !value.includes('\u0000'), 'NUL is not supported');
const versionSchema = z.number().int().min(1).max(2147483646);

export const createTaskSchema = z.strictObject({
  id: z.uuidv4(),
  title: titleSchema,
  description: descriptionSchema,
  priority: prioritySchema,
  status: statusSchema,
});

export const updateTaskSchema = z.strictObject({
  version: versionSchema,
  title: titleSchema.optional(),
  description: descriptionSchema.optional(),
  priority: prioritySchema.optional(),
  status: statusSchema.optional(),
}).refine((data) => Object.keys(data).length > 1, 'At least one field is required');

export const deleteTaskSchema = z.strictObject({ version: versionSchema });
export const taskSchema = createTaskSchema.extend({
  version: z.number().int().positive(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export const taskListSchema = z.strictObject({ items: z.array(taskSchema), limitReached: z.boolean() });

export type Status = z.infer<typeof statusSchema>;
export type Priority = z.infer<typeof prioritySchema>;
export type CreateTask = z.infer<typeof createTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type Task = z.infer<typeof taskSchema>;
