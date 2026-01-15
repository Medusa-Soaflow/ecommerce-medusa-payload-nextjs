import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

const VALID_TAGS = ["collections", "categories", "products"] as const
type ValidTag = (typeof VALID_TAGS)[number]

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-revalidate-secret")

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { tag, tags } = body as { tag?: string; tags?: string[] }

    const tagsToRevalidate: string[] = []

    if (tag && VALID_TAGS.includes(tag as ValidTag)) {
      tagsToRevalidate.push(tag)
    }

    if (tags && Array.isArray(tags)) {
      tags.forEach((t) => {
        if (
          VALID_TAGS.includes(t as ValidTag) &&
          !tagsToRevalidate.includes(t)
        ) {
          tagsToRevalidate.push(t)
        }
      })
    }

    if (tagsToRevalidate.length === 0) {
      return NextResponse.json(
        { message: "No valid tags provided", validTags: VALID_TAGS },
        { status: 400 }
      )
    }

    tagsToRevalidate.forEach((t) => revalidateTag(t))

    return NextResponse.json({
      revalidated: true,
      tags: tagsToRevalidate,
      timestamp: Date.now(),
    })
  } catch (error) {
    return NextResponse.json(
      { message: "Error parsing request body" },
      { status: 400 }
    )
  }
}
