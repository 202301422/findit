import { z } from "zod";
import mongoose from "mongoose";

const isValidObjectId = (val) => typeof val === "string" && mongoose.Types.ObjectId.isValid(val);

export const ChatRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .max(1000, "Message cannot exceed 1000 characters")
    .optional()
    .default(""),
  imageUrl: z.string().nullable().optional().default(null),
  imageBase64: z.string().nullable().optional().default(null),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(1000, "History message content cannot exceed 1000 characters"),
      })
    )
    .max(6, "History cannot exceed 6 messages")
    .optional()
    .default([]),
  contextListings: z
    .array(
      z.object({
        id: z.string().refine(isValidObjectId, { message: "Invalid MongoDB ObjectId" }),
        type: z.enum(["sell", "found", "ticket", "pass"]),
      })
    )
    .max(4, "Cannot provide more than 4 context listings")
    .optional()
    .default([]),
  activePageContext: z
    .object({
      pathname: z.string().optional(),
      currentProductId: z
        .string()
        .refine((val) => !val || isValidObjectId(val), { message: "Invalid MongoDB ObjectId" })
        .optional(),
      currentProductType: z.enum(["sell", "found", "ticket", "pass"]).optional(),
      currentTab: z.string().optional(),
    })
    .optional()
    .default({}),
});

export const AssistantIntentZodSchema = z.object({
  intent: z
    .enum([
      "search_listings",
      "compare_listings",
      "listing_details",
      "app_help",
      "greeting",
      "clarify",
      "unsupported",
    ])
    .default("search_listings"),
  types: z
    .array(z.enum(["sell", "found", "ticket", "pass"]))
    .optional()
    .default([]),
  search: z.string().nullable().optional().default(null),
  category: z.string().nullable().optional().default(null),
  maxPrice: z
    .number()
    .nonnegative()
    .nullable()
    .optional()
    .default(null),
  isNegotiable: z.boolean().nullable().optional().default(null),
  hasWarranty: z.boolean().nullable().optional().default(null),
  minSeats: z
    .number()
    .positive()
    .nullable()
    .optional()
    .default(null),
  dateAfter: z.string().nullable().optional().default(null),
  dateBefore: z.string().nullable().optional().default(null),
  originCity: z.string().nullable().optional().default(null),
  destinationCity: z.string().nullable().optional().default(null),
  venue: z.string().nullable().optional().default(null),
  sort: z
    .enum(["recent", "price_asc", "price_desc", "usage_asc", "usage_desc"])
    .nullable()
    .optional()
    .default(null),
  clarificationQuestion: z.string().nullable().optional().default(null),
});

export const AssistantComparisonZodSchema = z.object({
  summary: z.string().default("Listing comparison"),
  bestChoiceListingId: z.string().nullable().default(null),
  items: z
    .array(
      z.object({
        listingId: z.string(),
        advantages: z.array(z.string()).default([]),
        limitations: z.array(z.string()).default([]),
      })
    )
    .default([]),
  caveats: z.array(z.string()).default([]),
});

export const INTENT_JSON_STRUCTURE_PROMPT = `
Respond ONLY with a JSON object strictly conforming to this structure:
{
  "intent": "search_listings" | "compare_listings" | "listing_details" | "app_help" | "greeting" | "clarify" | "unsupported",
  "types": ["sell" | "found" | "ticket" | "pass"],
  "search": string | null,
  "category": string | null,
  "maxPrice": number | null,
  "isNegotiable": boolean | null,
  "hasWarranty": boolean | null,
  "minSeats": number | null,
  "dateAfter": string | null,
  "dateBefore": string | null,
  "originCity": string | null,
  "destinationCity": string | null,
  "venue": string | null,
  "sort": "recent" | "price_asc" | "price_desc" | "usage_asc" | "usage_desc" | null,
  "clarificationQuestion": string | null
}
`;

export const COMPARISON_JSON_STRUCTURE_PROMPT = `
Respond ONLY with a JSON object strictly conforming to this structure:
{
  "summary": string,
  "bestChoiceListingId": string | null,
  "items": [
    {
      "listingId": string,
      "advantages": [string],
      "limitations": [string]
    }
  ],
  "caveats": [string]
}
`;
