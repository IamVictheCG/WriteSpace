import { z } from 'zod'

export const jobPostSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
  category_id: z.string().uuid('Select a valid category'),
  budget_ngn: z.coerce.number().positive().optional(),
})

export type JobPostInput = z.infer<typeof jobPostSchema>
