import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

const VALID_TAGS = ["collections", "categories", "products"] as const;
type ValidTag = (typeof VALID_TAGS)[number];

// Map tags to cache key patterns
const TAG_PATTERNS: Record<ValidTag, string[]> = {
  products: ["*product*", "*payload_product*"],
  collections: ["*collection*", "*payload_collection*"],
  categories: ["*category*", "*payload_category*"],
};

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const secret = req.headers["x-revalidate-secret"];

  if (secret !== process.env.REVALIDATE_SECRET) {
    return res.status(401).json({ message: "Invalid secret" });
  }

  try {
    const cacheModule = req.scope.resolve("cache", { allowUnregistered: true });

    if (!cacheModule) {
      return res.json({
        success: true,
        message: "No cache module configured",
        timestamp: Date.now(),
      });
    }

    const body = req.body as { tags?: string[]; invalidateAll?: boolean };
    const { tags, invalidateAll } = body || {};

    // If invalidateAll is requested, clear everything
    if (invalidateAll) {
      await cacheModule.invalidate("*");
      return res.json({
        success: true,
        message: "All cache invalidated",
        timestamp: Date.now(),
      });
    }

    // Collect patterns to invalidate based on tags
    const patterns: string[] = [];

    if (tags && Array.isArray(tags)) {
      tags.forEach((tag) => {
        if (VALID_TAGS.includes(tag as ValidTag)) {
          patterns.push(...TAG_PATTERNS[tag as ValidTag]);
        }
      });
    }

    // If no valid tags provided, invalidate common query cache patterns
    if (patterns.length === 0) {
      patterns.push("*product*", "*collection*", "*category*");
    }

    // Invalidate each pattern
    const invalidated: string[] = [];
    for (const pattern of patterns) {
      try {
        await cacheModule.invalidate(pattern);
        invalidated.push(pattern);
      } catch (err) {
        console.warn(`[Cache] Failed to invalidate pattern ${pattern}:`, err);
      }
    }

    return res.json({
      success: true,
      invalidated,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("[Cache Invalidation] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to invalidate cache",
      error: String(error),
    });
  }
};
