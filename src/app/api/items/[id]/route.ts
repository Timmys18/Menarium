import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(_: Request, context: { params: { id: string } }) {
  const id = context.params.id

  try {
    const item = await prisma.item.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!item) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 })
  }
}
