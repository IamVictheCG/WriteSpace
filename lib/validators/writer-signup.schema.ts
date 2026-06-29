import { z } from 'zod'

export const writerSignupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
  full_name: z.string().min(2, 'Full name is required'),
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
  response_time_hours: z.coerce.number().int().min(1).max(48),
  price_range_min_ngn: z.coerce.number().positive('Minimum price must be positive'),
  price_range_max_ngn: z.coerce.number().positive('Maximum price must be positive'),
  bank_name: z.string().min(1, 'Bank name is required'),
  bank_account_number: z.string().min(10, 'Enter a valid account number').max(10, 'Enter a valid account number'),
  bank_account_name: z.string().min(2, 'Account name is required'),
  category_ids: z.array(z.string().uuid()).min(1, 'Select at least one category'),
}).refine(data => data.price_range_max_ngn >= data.price_range_min_ngn, {
  message: 'Maximum price must be greater than or equal to minimum price',
  path: ['price_range_max_ngn'],
})

export type WriterSignupInput = z.infer<typeof writerSignupSchema>
