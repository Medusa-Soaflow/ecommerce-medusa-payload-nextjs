type RevalidateTag = 'collections' | 'categories' | 'products'

export const revalidateStorefront = async (tags: RevalidateTag[]) => {
  const storefrontUrl = process.env.STOREFRONT_URL
  const medusaUrl = process.env.MEDUSA_BACKEND_URL
  const revalidateSecret = process.env.REVALIDATE_SECRET

  if (!revalidateSecret) {
    console.warn('[Revalidation] Missing REVALIDATE_SECRET environment variable')
    return
  }

  const results: { storefront?: any; medusa?: any } = {}

  // Revalidate storefront cache (Next.js)
  if (storefrontUrl) {
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
        console.error('[Revalidation] Storefront failed:', await response.text())
      } else {
        results.storefront = await response.json()
      }
    } catch (error) {
      console.error('[Revalidation] Storefront error:', error)
    }
  }

  // Invalidate Medusa cache (Redis)
  if (medusaUrl) {
    try {
      const response = await fetch(`${medusaUrl}/hooks/cache/invalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-revalidate-secret': revalidateSecret,
        },
        body: JSON.stringify({ tags }),
      })

      if (!response.ok) {
        console.error('[Revalidation] Medusa failed:', await response.text())
      } else {
        results.medusa = await response.json()
      }
    } catch (error) {
      console.error('[Revalidation] Medusa error:', error)
    }
  }

  if (results.storefront || results.medusa) {
    console.log('[Revalidation] Success:', results)
  }
}
