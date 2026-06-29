import { z } from 'zod'

export const messageSchema = z.object({
  project_id: z.string().uuid(),
  content: z.string().min(1, 'Message cannot be empty').max(5000),
})

export type MessageInput = z.infer<typeof messageSchema>
