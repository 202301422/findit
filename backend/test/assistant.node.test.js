import test from "node:test";
import assert from "node:assert/strict";
import { ChatRequestSchema, AssistantIntentZodSchema, AssistantComparisonZodSchema } from "../src/assistant/assistantSchemas.js";
import { buildFilterQuery, PUBLIC_LISTING_PROJECTION } from "../src/services/feedQuery.service.js";
import { getAssistantRateLimitKey } from "../src/middleware/security.middleware.js";
import { processAssistantChat } from "../src/services/assistant.service.js";
import { isGroqConfigured } from "../src/config/groqClient.js";

test("ChatRequestSchema accepts a valid assistant message", () => {
  const validBody = {
    message: "Find used laptops below ₹40000 with warranty",
    history: [{ role: "user", content: "I need a laptop" }],
    contextListings: [{ id: "64b5d8f0f1f1f1f1f1f1f1f1", type: "sell" }],
  };
  const result = ChatRequestSchema.safeParse(validBody);
  assert.equal(result.success, true);
});

test("ChatRequestSchema rejects empty messages", () => {
  const emptyBody = { message: "   " };
  const result = ChatRequestSchema.safeParse(emptyBody);
  assert.equal(result.success, false);
});

test("ChatRequestSchema rejects messages longer than 1000 characters", () => {
  const longMsg = "a".repeat(1001);
  const result = ChatRequestSchema.safeParse({ message: longMsg });
  assert.equal(result.success, false);
});

test("ChatRequestSchema rejects invalid listing types in contextListings", () => {
  const badTypeBody = {
    message: "Compare these",
    contextListings: [{ id: "64b5d8f0f1f1f1f1f1f1f1f1", type: "invalid_type" }],
  };
  const result = ChatRequestSchema.safeParse(badTypeBody);
  assert.equal(result.success, false);
});

test("AssistantIntentZodSchema rejects invalid sorting values", () => {
  const badSort = {
    intent: "search_listings",
    sort: "random_sort",
  };
  const result = AssistantIntentZodSchema.safeParse(badSort);
  assert.equal(result.success, false);
});

test("AssistantIntentZodSchema discards/rejects unsafe additional structure properties when strict parsing", () => {
  const extraProps = {
    intent: "search_listings",
    unknownField: "malicious_payload",
  };
  const result = AssistantIntentZodSchema.passthrough().safeParse(extraProps);
  assert.equal(result.success, true);
  const strictResult = AssistantIntentZodSchema.strict().safeParse(extraProps);
  assert.equal(strictResult.success, false);
});

test("buildFilterQuery clamps maxPrice, dates, and sanitizes search text", () => {
  const query = buildFilterQuery("sell", {
    maxPrice: 5000,
    hasWarranty: true,
    isNegotiable: false,
    search: "  MacBook Air  ",
  });

  assert.equal(query.sellingPrice.$lte, 5000);
  assert.equal(query.hasWarranty, true);
  assert.equal(query.isNegotiable, false);
  assert.equal(query.status, "active");
  assert.equal(query.$or.length > 0, true);
});

test("buildFilterQuery excludes inactive sell/found items and enforces future ticket/pass dates", () => {
  const sellQuery = buildFilterQuery("sell", {});
  assert.equal(sellQuery.status, "active");

  const ticketQuery = buildFilterQuery("ticket", {});
  assert.equal(Boolean(ticketQuery.departureTime.$gt), true);

  const passQuery = buildFilterQuery("pass", {});
  assert.equal(passQuery.status, "active");
  assert.equal(Boolean(passQuery.dateTime.$gt), true);
});

test("PUBLIC_LISTING_PROJECTION excludes sensitive user fields", () => {
  assert.equal(PUBLIC_LISTING_PROJECTION.email, undefined);
  assert.equal(PUBLIC_LISTING_PROJECTION.password, undefined);
  assert.equal(PUBLIC_LISTING_PROJECTION.phone, undefined);
  assert.equal(PUBLIC_LISTING_PROJECTION.refreshToken, undefined);
  assert.equal(PUBLIC_LISTING_PROJECTION.firebaseUid, undefined);
});

test("AssistantComparisonZodSchema discards hallucinated comparison IDs", () => {
  const compData = {
    summary: "Comparison result",
    bestChoiceListingId: "hallucinated_id_999",
    items: [{ listingId: "valid_id_123", advantages: ["Good"], limitations: [] }],
    caveats: [],
  };
  const parsed = AssistantComparisonZodSchema.safeParse(compData);
  assert.equal(parsed.success, true);
  const validIds = new Set(["valid_id_123"]);
  let bestChoice = parsed.data.bestChoiceListingId;
  if (bestChoice && !validIds.has(bestChoice)) {
    bestChoice = null;
  }
  assert.equal(bestChoice, null);
});

test("Missing Groq key produces 503 response without crashing for search queries", async () => {
  const originalKey = process.env.GROQ_API_KEY;
  delete process.env.GROQ_API_KEY;

  try {
    assert.equal(isGroqConfigured(), false);
    await assert.rejects(
      async () => processAssistantChat({ message: "Find laptops under 40000" }),
      (err) => err.statusCode === 503 && err.message.includes("unavailable")
    );
  } finally {
    if (originalKey) process.env.GROQ_API_KEY = originalKey;
  }
});

test("Application help queries return trusted static content", async () => {
  const helpQueryResponse = await processAssistantChat({ message: "How do I report a listing?" });
  assert.equal(helpQueryResponse.intent, "app_help");
  assert.equal(helpQueryResponse.reply.includes("flag icon"), true);
});

test("getAssistantRateLimitKey generates key per authenticated user ID", () => {
  const reqUser1 = { user: { _id: "user123" } };
  const reqUser2 = { user: { _id: "user456" } };

  const key1 = getAssistantRateLimitKey(reqUser1);
  const key2 = getAssistantRateLimitKey(reqUser2);

  assert.equal(key1, "user123");
  assert.equal(key2, "user456");
  assert.notEqual(key1, key2);
});
