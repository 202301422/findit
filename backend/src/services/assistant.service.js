import ApiError from "../utils/ApiError.js";
import { getGroqClient, isGroqConfigured, GROQ_MODEL } from "../config/groqClient.js";
import {
  getAssistantSystemPrompt,
  getCandidateEvaluationSystemPrompt,
  getComparisonSystemPrompt,
} from "../assistant/assistantPrompt.js";
import {
  ChatRequestSchema,
  AssistantIntentZodSchema,
  AssistantComparisonZodSchema,
  INTENT_JSON_STRUCTURE_PROMPT,
  COMPARISON_JSON_STRUCTURE_PROMPT,
} from "../assistant/assistantSchemas.js";
import { fetchCandidateListings, queryListingById } from "./feedQuery.service.js";
import { z } from "zod";

const CandidateEvaluationZodSchema = z.object({
  matchingListingIds: z.array(z.string()).default([]),
  explanation: z.string().nullable().optional().default(null),
});

const STATIC_HELP_MAP = [
  {
    keywords: ["report", "flag", "suspicious", "scam", "inappropriate", "fake", "misconduct"],
    reply: "To report a suspicious listing or inappropriate behavior, click the flag icon on any listing card or user profile. Our campus admin team reviews reports promptly.",
  },
  {
    keywords: ["lost", "found", "report lost", "found item", "property"],
    reply: "To report a lost item or post something you found, click '+ Add Listing' at the top of the screen and select 'Lost & Found'. Include clear photos and location details.",
  },
  {
    keywords: ["save", "bookmark", "saved posts", "favorite"],
    reply: "You can save any listing by clicking the bookmark icon on its card. Access all your saved items anytime under Profile > Saved Posts.",
  },
  {
    keywords: ["follow", "peers", "following feed", "student"],
    reply: "Follow fellow students by visiting their profile and clicking 'Follow'. Their newest listings will appear directly in your 'Following' feed tab on the Home page.",
  },
  {
    keywords: ["pay", "payment", "buy", "safety", "safe", "meet", "cash", "upi"],
    reply: "FindIt facilitates direct peer-to-peer exchanges. We strongly recommend meeting in public campus locations (Library, SAC, Security Desk) and inspecting items in person before completing payment via cash or UPI.",
  },
  {
    keywords: ["ticket", "pass", "concert", "bus", "train", "flight", "event"],
    reply: "You can discover or sell travel tickets and event passes under the 'Travelling Tickets' and 'Event Passes' tabs on the Home page or via '+ Add Listing'.",
  },
  {
    keywords: ["how does findit work", "what is findit", "help", "about findit"],
    reply: "FindIt is your campus marketplace and lost-and-found hub. You can buy and sell items, report lost/found property, exchange travel tickets or event passes, and follow fellow campus peers safely.",
  },
];

const findStaticHelp = (message) => {
  const lowerMsg = message.toLowerCase();
  for (const item of STATIC_HELP_MAP) {
    if (item.keywords.some((kw) => lowerMsg.includes(kw))) {
      return item.reply;
    }
  }
  return null;
};

const extractJsonFromText = (text) => {
  if (!text) return null;
  const clean = text.trim();
  try {
    return JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
};

const GREETING_REGEX = /^(hi|hello|hey|greetings|good morning|good evening|good afternoon|howdy|sup)\b/i;

export const processAssistantChat = async (body) => {
  const validationResult = ChatRequestSchema.safeParse(body);
  if (!validationResult.success) {
    const issueMsg = validationResult.error.issues.map((i) => i.message).join(", ");
    throw new ApiError(400, `Invalid chat request: ${issueMsg}`);
  }

  const { message, history, contextListings, activePageContext } = validationResult.data;

  // Check static help first
  const isHelpQuery = /how (do|to|can) i|where is|report|policy|terms|privacy|payment|safety/i.test(message);
  if (isHelpQuery) {
    const helpReply = findStaticHelp(message);
    if (helpReply) {
      return {
        reply: helpReply,
        intent: "app_help",
        listings: [],
        appliedFilters: {},
        clarificationQuestion: null,
        comparison: null,
        suggestedPrompts: ["Find used laptops", "Search Lost & Found", "Find a travel ticket"],
      };
    }
  }

  if (!isGroqConfigured()) {
    throw new ApiError(503, "FindIt AI Assistant ('GetIt') is currently unavailable due to unconfigured API key.");
  }

  const groq = getGroqClient();

  // Fetch focused page product context if user is on product details page
  let focusedProductDoc = null;
  if (activePageContext?.currentProductId && activePageContext?.currentProductType) {
    try {
      focusedProductDoc = await queryListingById(
        activePageContext.currentProductId,
        activePageContext.currentProductType
      );
    } catch {
      // ignore invalid focused item query
    }
  }

  // Handle Comparison Intent
  const isComparisonRequest = /compare|difference|which is better|versus|\bvs\b/i.test(message) || (contextListings.length >= 2);
  if (isComparisonRequest && contextListings.length >= 2) {
    return await handleComparison({ groq, message, history, contextListings });
  }

  // Handle Search & General Assistant Request
  let systemPrompt = getAssistantSystemPrompt();

  if (focusedProductDoc) {
    systemPrompt += `\n\n[ITEM CURRENTLY OPEN ON USER'S SCREEN]:
ID: ${focusedProductDoc._id}
Title: ${focusedProductDoc.name || focusedProductDoc.ticketType}
Type: ${focusedProductDoc.type}
Category: ${focusedProductDoc.category || focusedProductDoc.ticketType || "N/A"}
Price: ₹${focusedProductDoc.sellingPrice || focusedProductDoc.price || 0}
Negotiable: ${focusedProductDoc.isNegotiable ? "Yes" : "No"}
Warranty: ${focusedProductDoc.hasWarranty ? `${focusedProductDoc.warrantyValue || ""} ${focusedProductDoc.warrantyUnit || ""}` : "No"}
Description: ${focusedProductDoc.description || "No description"}
Seller: ${focusedProductDoc.user?.name || "Campus Peer"}
If the user asks questions about "this item", "is it negotiable", "does it have warranty", or product questions, answer directly based on this listing data!`;
  }

  const historyMessages = (history || []).slice(-6).map((h) => ({
    role: h.role,
    content: h.content,
  }));

  const userPromptText = `User message: "${message}"

${INTENT_JSON_STRUCTURE_PROMPT}`;

  let groqResponseRaw = null;
  try {
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...historyMessages,
        { role: "user", content: userPromptText },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });
    groqResponseRaw = response.choices[0]?.message?.content;
  } catch (err) {
    console.error("[Groq Error] Chat completion failed:", err.message);
    throw new ApiError(502, "Failed to communicate with AI service");
  }

  const parsedJson = extractJsonFromText(groqResponseRaw);
  const validatedIntent = AssistantIntentZodSchema.safeParse(parsedJson);

  if (!validatedIntent.success) {
    console.warn("[Assistant Intent Validation Fallback]:", validatedIntent.error);
  }

  const extracted = validatedIntent.success
    ? validatedIntent.data
    : {
        intent: "search_listings",
        types: [],
        search: message,
        category: null,
        maxPrice: null,
        isNegotiable: null,
        hasWarranty: null,
        minSeats: null,
        dateAfter: null,
        dateBefore: null,
        originCity: null,
        destinationCity: null,
        venue: null,
        sort: null,
        clarificationQuestion: null,
      };

  // Strictly enforce greeting regex
  const isExplicitGreeting = GREETING_REGEX.test(message.trim());
  if (extracted.intent === "greeting" && !isExplicitGreeting) {
    extracted.intent = "search_listings";
  }

  if (extracted.intent === "app_help") {
    const helpReply = findStaticHelp(message) || "You can create listings, search Lost & Found property, exchange passes/tickets, and message sellers directly on FindIt.";
    return {
      reply: helpReply,
      intent: "app_help",
      listings: [],
      appliedFilters: {},
      clarificationQuestion: null,
      comparison: null,
      suggestedPrompts: ["Find used laptops", "Search Lost & Found", "Find a travel ticket"],
    };
  }

  if (extracted.intent === "greeting" && isExplicitGreeting) {
    return {
      reply: "Hi! I’m GetIt, your FindIt Assistant. I can help you discover marketplace items, lost property, tickets, and passes.",
      intent: "greeting",
      listings: [],
      appliedFilters: {},
      clarificationQuestion: null,
      comparison: null,
      suggestedPrompts: ["Find laptops under ₹40,000", "Show negotiable calculators", "Backpacks near library"],
    };
  }

  const requestedTypes = (extracted.types && extracted.types.length > 0)
    ? extracted.types
    : ["sell", "found", "ticket", "pass"];

  const searchFilters = {
    category: extracted.category,
    maxPrice: extracted.maxPrice,
    isNegotiable: extracted.isNegotiable,
    hasWarranty: extracted.hasWarranty,
    minSeats: extracted.minSeats,
    dateAfter: extracted.dateAfter,
    dateBefore: extracted.dateBefore,
    originCity: extracted.originCity,
    destinationCity: extracted.destinationCity,
    venue: extracted.venue,
    search: extracted.search || message,
    sort: extracted.sort,
  };

  // Fetch candidate active listings from MongoDB (with fuzzy token search)
  const candidates = await fetchCandidateListings(requestedTypes, searchFilters, 30);

  let finalResults = [];
  let aiExplanation = null;

  if (candidates.length > 0) {
    // Pass candidates to Groq for semantic evaluation, typo tolerance & image context analysis
    const candidateDataPrompt = candidates.map((c) => ({
      id: c._id,
      type: c.type,
      name: c.name || c.ticketType || "Item",
      category: c.category || c.ticketType || "Uncategorized",
      description: c.description || "",
      price: c.sellingPrice || c.price || 0,
      imageUrl: c.imageUrl || (c.images && c.images.length > 0 ? c.images[0].url : null),
      venue: c.venue || c.origin?.city || null,
    }));

    const evalUserPrompt = `User Query: "${message}"

Extracted search filter: ${JSON.stringify(searchFilters)}

Candidate Listings in MongoDB:
${JSON.stringify(candidateDataPrompt, null, 2)}

Select matching candidate listing IDs based on name, typo matching (e.g. Taylot Swift -> Taylor Swift), category, description, and image context.
If ZERO candidates genuinely match the user query, return an empty array matchingListingIds: [].
Respond ONLY in JSON format: { "matchingListingIds": ["id1"], "explanation": "..." }`;

    try {
      const evalRes = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: getCandidateEvaluationSystemPrompt() },
          { role: "user", content: evalUserPrompt },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      });

      const evalRaw = evalRes.choices[0]?.message?.content;
      const parsedEval = extractJsonFromText(evalRaw);
      const validatedEval = CandidateEvaluationZodSchema.safeParse(parsedEval);

      if (validatedEval.success && validatedEval.data.matchingListingIds.length > 0) {
        const matchedIds = new Set(validatedEval.data.matchingListingIds);
        finalResults = candidates.filter((c) => matchedIds.has(c._id)).slice(0, 8);
        aiExplanation = validatedEval.data.explanation;
      }
    } catch (evalErr) {
      console.warn("[Groq Semantic Evaluation Warning]:", evalErr.message);
    }
  }

  // If focused product was asked about and 0 search results match, answer directly using focused product
  if (focusedProductDoc && finalResults.length === 0) {
    const isAboutFocused = /this|negotiable|warranty|price|condition|seller|good/i.test(message);
    if (isAboutFocused) {
      finalResults = [focusedProductDoc];
    }
  }

  // Override clarification question if matching candidates were found!
  if (finalResults.length > 0) {
    extracted.clarificationQuestion = null;
    extracted.intent = "search_listings";
  } else if (extracted.intent === "clarify" && extracted.clarificationQuestion) {
    return {
      reply: extracted.clarificationQuestion,
      intent: "clarify",
      listings: [],
      appliedFilters: {},
      clarificationQuestion: extracted.clarificationQuestion,
      comparison: null,
      suggestedPrompts: ["Under ₹30,000", "Only negotiable items", "Show all"],
    };
  }

  // Derive clean search term for Home filter matching
  let cleanSearchForHome = searchFilters.search;
  if (finalResults.length > 0) {
    const firstMatch = finalResults[0];
    const itemTitle = firstMatch.name || firstMatch.ticketType || "";
    if (itemTitle && searchFilters.search && !itemTitle.toLowerCase().includes(searchFilters.search.toLowerCase())) {
      cleanSearchForHome = itemTitle.split(" ")[0];
    }
  }

  const appliedFiltersClean = {
    types: requestedTypes,
    search: cleanSearchForHome || undefined,
    category: searchFilters.category || undefined,
    maxPrice: searchFilters.maxPrice || undefined,
    isNegotiable: searchFilters.isNegotiable ?? undefined,
    hasWarranty: searchFilters.hasWarranty ?? undefined,
    minSeats: searchFilters.minSeats || undefined,
    dateAfter: searchFilters.dateAfter || undefined,
    dateBefore: searchFilters.dateBefore || undefined,
    originCity: searchFilters.originCity || undefined,
    destinationCity: searchFilters.destinationCity || undefined,
    venue: searchFilters.venue || undefined,
    sort: searchFilters.sort || undefined,
  };

  let replyText = "";
  if (finalResults.length === 0) {
    replyText = "I could not find an active listing matching those requirements. Try adjusting your search term or price limit.";
  } else {
    replyText = aiExplanation || `I found ${finalResults.length} matching listing${finalResults.length === 1 ? "" : "s"}.`;
  }

  // Build Rufus-style dynamic follow-up suggestions
  const suggestedPrompts = [];
  if (finalResults.length > 0) {
    suggestedPrompts.push("Only negotiable listings", "Show cheapest first");
    if (finalResults.length >= 2) {
      suggestedPrompts.push("Compare these results");
    }
  } else {
    suggestedPrompts.push("Show all marketplace items", "Search Lost & Found", "Browse Event Passes");
  }

  return {
    reply: replyText,
    intent: extracted.intent || "search_listings",
    listings: finalResults,
    appliedFilters: appliedFiltersClean,
    clarificationQuestion: null,
    comparison: null,
    suggestedPrompts,
  };
};

const handleComparison = async ({ groq, message, history, contextListings }) => {
  const validFetchedListings = [];
  const validIds = new Set();

  for (const ref of contextListings) {
    if (ref.id && ref.type) {
      const item = await queryListingById(ref.id, ref.type);
      if (item) {
        validFetchedListings.push(item);
        validIds.add(item._id.toString());
      }
    }
  }

  if (validFetchedListings.length < 2) {
    return {
      reply: "Please select 2 to 4 active listings to perform a comparison.",
      intent: "compare_listings",
      listings: [],
      appliedFilters: {},
      clarificationQuestion: null,
      comparison: null,
      suggestedPrompts: ["Find used laptops", "Search Lost & Found"],
    };
  }

  const safeListingDataPrompt = validFetchedListings.map((item) => {
    return `[LISTING ID: ${item._id}]
Type: ${item.type}
Title/Name: ${item.name || item.ticketType || "Item"}
Price/SellingPrice: ${item.sellingPrice || item.price || "N/A"}
Category: ${item.category || item.ticketType || "N/A"}
Description: ${item.description || "N/A"}
Negotiable: ${item.isNegotiable ? "Yes" : "No"}
Warranty: ${item.hasWarranty ? `${item.warrantyValue || ""} ${item.warrantyUnit || ""}` : "No"}
Quantity: ${item.quantity || 1}
Date/Time: ${item.dateTime || item.departureTime || "N/A"}`;
  }).join("\n---\n");

  const promptText = `Listings data to compare:
${safeListingDataPrompt}

User prompt: "${message}"

${COMPARISON_JSON_STRUCTURE_PROMPT}`;

  let groqRaw = null;
  try {
    const res = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: getComparisonSystemPrompt() },
        { role: "user", content: promptText },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });
    groqRaw = res.choices[0]?.message?.content;
  } catch (err) {
    console.error("[Groq Comparison Error]:", err.message);
    throw new ApiError(502, "Failed to generate comparison from AI service");
  }

  const parsed = extractJsonFromText(groqRaw);
  const validatedComp = AssistantComparisonZodSchema.safeParse(parsed);

  const comparisonData = validatedComp.success
    ? validatedComp.data
    : {
        summary: "Comparison of selected items",
        bestChoiceListingId: null,
        items: validFetchedListings.map((l) => ({
          listingId: l._id,
          advantages: ["Active listing"],
          limitations: [],
        })),
        caveats: ["Suitability depends on your requirements."],
      };

  if (comparisonData.bestChoiceListingId && !validIds.has(String(comparisonData.bestChoiceListingId))) {
    comparisonData.bestChoiceListingId = null;
  }

  comparisonData.items = (comparisonData.items || []).filter((item) => validIds.has(String(item.listingId)));

  return {
    reply: comparisonData.summary || "Here is the comparison between the selected listings.",
    intent: "compare_listings",
    listings: validFetchedListings,
    appliedFilters: {},
    clarificationQuestion: null,
    comparison: comparisonData,
    suggestedPrompts: ["Find more items", "Clear comparison"],
  };
};
