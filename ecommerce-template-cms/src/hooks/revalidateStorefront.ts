type RevalidateTag = 'collections' | 'categories' | 'products'

export const revalidateStorefront = async (tags: RevalidateTag[]) => {
  const storefrontUrl = process.env.STOREFRONT_URL
  const revalidateSecret = process.env.REVALIDATE_SECRET

  if (!storefrontUrl || !revalidateSecret) {
    console.warn(
      '[Revalidation] Missing STOREFRONT_URL or REVALIDATE_SECRET environment variables'
    )
    return
  }

  try {
    const response = await fetch(`${storefrontUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': revalidateSecret,
      },
      body: JSON.stringify({ tags }),
    })

    if (!response.ok) {
      console.error('[Revalidation] Failed to revalidate:', await response.text())
      return
    }

    const result = await response.json()
    console.log('[Revalidation] Success:', result)
  } catch (error) {
    console.error('[Revalidation] Error:', error)
  }
}
