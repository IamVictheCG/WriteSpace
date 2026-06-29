import { NextResponse } from 'next/server'
import { getActiveCategories } from '@/lib/data/categories'

export async function GET() {
  try {
    const categories = await getActiveCategories()
    return NextResponse.json(categories)
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}
