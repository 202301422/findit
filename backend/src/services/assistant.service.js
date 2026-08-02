import ApiError from "../utils/ApiError.js";
import { getGroqClient, isGroqConfigured, GROQ_MODEL, GROQ_VISION_MODEL } from "../config/groqClient.js";
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
    keywords: ["profile", "my profile", "profile page", "account", "my account", "my listings", "user profile", "open profile", "where is profile", "where can i open my profile", "view profile"],
    reply: "To open your Profile page:\n\n1. Look at the top navigation bar at the top-right corner of your screen.\n2. Click on your **User Avatar / Profile Menu**.\n3. Select **Profile** to view your active listings, draft posts, saved listings, and edit account details.",
  },
  {
    keywords: ["faq", "faqs", "frequently asked", "help section", "where is faq", "where can i find faq", "support"],
    reply: "You are right here! **GetIt Assistant** is FindIt's interactive AI support hub.\n\nYou can ask me anything about:\n• Discovering & searching marketplace items\n• Reporting lost or found property\n• Exchanging travel tickets & event passes\n• Navigating pages, profile, messages, and safety tips",
  },
  {
    keywords: ["add listing", "create listing", "post item", "sell item", "how to sell", "how to add", "how to post", "new listing", "add item"],
    reply: "To post a new item or report property:\n\n1. Click the **+ Add Listing** button in the top navigation header.\n2. Select your category: **Buy & Sell**, **Lost & Found**, **Travelling Tickets**, or **Event Passes**.\n3. Fill in the title, price, photos, and description.\n4. Click **Submit** to publish your post to the campus feed.",
  },
  {
    keywords: ["saved", "bookmark", "favorite", "saved posts", "saved items", "where are my saved", "how to save"],
    reply: "To view your saved listings:\n\n1. Open your **Profile** page (top-right avatar icon).\n2. Click the **Saved Posts** tab.\n\n*Tip:* You can save any listing while browsing by clicking the **Bookmark** icon on its card.",
  },
  {
    keywords: ["chat", "message", "inbox", "talk to seller", "dm", "messages", "how to chat", "where is chat"],
    reply: "To access your messages:\n\n1. Click the **Message / Chat** icon in the top header.\n2. Select any conversation to chat with buyers or sellers directly.\n\n*Tip:* To start a new conversation, click **Message Seller** on any listing page.",
  },
  {
    keywords: ["lost", "found", "report lost", "found item", "lost property", "lost and found"],
    reply: "To report lost or found items:\n\n1. Select the **Lost & Found** tab on the Home page to view current items.\n2. To post a new report, click **+ Add Listing** in the top header and choose **Lost & Found**.\n3. Choose status (**Lost** or **Found**), add location details, and upload photos.",
  },
  {
    keywords: ["ticket", "pass", "concert", "bus", "train", "flight", "event", "event pass", "travel ticket"],
    reply: "To exchange tickets or event passes:\n\n• Browse available listings under **Event Passes** or **Travelling Tickets** on the Home page.\n• To list your own ticket/pass, click **+ Add Listing** and choose **Travelling Tickets** or **Event Passes**.",
  },
  {
    keywords: ["notification", "notifications", "alerts", "bell", "unread"],
    reply: "To check notifications:\n\n1. Click the **Bell Icon** in the top header.\n2. Here you will find updates on chat messages, listing activity, followers, and admin broadcasts.",
  },
  {
    keywords: ["theme", "dark mode", "light mode", "color theme", "change theme", "toggle dark mode"],
    reply: "To change your app theme:\n\n1. Look at the top navigation header.\n2. Click the **Sun / Moon** icon to toggle between Light Mode and Dark Mode anytime.",
  },
  {
    keywords: ["edit listing", "delete listing", "remove post", "mark sold", "manage listing"],
    reply: "To edit or delete your listing:\n\n1. Go to your **Profile** page.\n2. Under **My Listings**, find your item.\n3. Click the menu options icon on the card to **Edit Details**, **Mark as Sold**, or **Delete**.",
  },
  {
    keywords: ["report", "flag", "suspicious", "scam", "inappropriate", "fake", "misconduct", "report user"],
    reply: "To report suspicious posts or behavior:\n\n1. Click the **Flag / Report** icon on any listing card or user profile.\n2. Select the reason and submit.\n3. Campus admins review all reports promptly to maintain campus safety.",
  },
  {
    keywords: ["pay", "payment", "buy", "safety", "safe", "meet", "cash", "upi", "safety tips"],
    reply: "Safety & Payment Guidelines:\n\n• **Public Campus Meets:** Meet in public, well-lit spots (Library, Student Activity Center, Canteen).\n• **Inspect In Person:** Check the condition of the item thoroughly before paying.\n• **Direct Peer Payment:** Pay via cash or UPI after inspecting the item.",
  },
  {
    keywords: ["follow", "peers", "following feed", "student", "follow user"],
    reply: "To follow campus peers:\n\n1. Open any student's profile page and click **Follow**.\n2. Their newly added listings will show up in your personalized **Following** tab on the Home page.",
  },
  {
    keywords: ["how does findit work", "what is findit", "help", "about findit", "how to use findit"],
    reply: "FindIt is your all-in-one university marketplace and lost-and-found hub:\n\n• **Buy & Sell:** Student marketplace for books, tech, dorm essentials.\n• **Lost & Found:** Report lost items or return found property.\n• **Tickets & Passes:** Exchange travel tickets and event passes.\n• **Peer Network:** Follow classmates and chat securely in-app.",
  },
];

const findStaticHelp = (message) => {
  if (!message) return null;
  const lowerMsg = message.toLowerCase().trim();
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

const extractPriceFromText = (text) => {
  if (!text) return null;
  const match =
    text.match(/(?:under|below|less than|within|max|<=?|₹|\brs\.?|\binr)\s*:?\s*₹?\s*(\d+(?:\,\d+)?)\s*(?:inr|rs\.?|rupees|₹)?/i) ||
    text.match(/(\d+(?:\,\d+)?)\s*(?:inr|rs\.?|rupees|₹)\b/i);
  if (match) {
    const parsed = parseFloat(match[1].replace(/,/g, ""));
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return null;
};

const analyzeImageWithVision = async (groq, imageInput, userMessage) => {
  const visionPrompt = `You are "GetIt", the FindIt AI Assistant visual recognition engine.
Analyze this uploaded photo for a university campus marketplace and lost-and-found platform.

Analyze the image:
1. Is it a physical marketplace item, book, electronics, backpack, clothing, bottle, calculator, ticket, pass, lost property, or keys?
2. Or is it a selfie, person, face, room, landscape, or non-marketplace photo?

Identify:
- itemTitle: primary item name (e.g. "Polo Shirt", "Black Water Bottle", "MacBook Air", "Person / Selfie")
- primaryColor: dominant visual color
- category: "sell" | "found" | "ticket" | "pass" | null
- searchKeywords: 2-4 database search keywords (or empty "" if non-marketplace item/person)
- isMarketplaceItem: true if physical product/item, false if selfie/person/non-item

User's accompanying text: "${userMessage || ""}"

Respond ONLY with a JSON object strictly matching this format:
{
  "itemTitle": "string",
  "primaryColor": "string",
  "category": "sell",
  "searchKeywords": "string",
  "isMarketplaceItem": true,
  "description": "string"
}`;

  try {
    const response = await groq.chat.completions.create({
      model: GROQ_VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: visionPrompt },
            { type: "image_url", image_url: { url: imageInput } },
          ],
        },
      ],
      temperature: 0.1,
    });

    const raw = response.choices[0]?.message?.content;
    const parsed = extractJsonFromText(raw);
    if (parsed && (parsed.searchKeywords !== undefined || parsed.itemTitle)) {
      const isMarketplace = parsed.isMarketplaceItem !== false && Boolean(parsed.searchKeywords && parsed.searchKeywords.trim().length > 0);
      return {
        itemTitle: parsed.itemTitle || "Uploaded Photo",
        primaryColor: parsed.primaryColor || "",
        category: parsed.category || null,
        searchKeywords: isMarketplace ? parsed.searchKeywords.trim() : "",
        isMarketplaceItem: isMarketplace,
        description: parsed.description || "",
      };
    }
  } catch (err) {
    console.warn("[Assistant Vision Warning]: Groq vision model completion failed, falling back:", err.message);
  }

  const fallbackKeywords = userMessage && !/similar|item|product|exact/i.test(userMessage) ? userMessage : "";
  return {
    itemTitle: "Uploaded Photo",
    primaryColor: "",
    category: null,
    searchKeywords: fallbackKeywords,
    isMarketplaceItem: Boolean(fallbackKeywords),
    description: "Uploaded image item search",
  };
};

export const processAssistantChat = async (body) => {
  const validationResult = ChatRequestSchema.safeParse(body);
  if (!validationResult.success) {
    const issueMsg = validationResult.error.issues.map((i) => i.message).join(", ");
    throw new ApiError(400, `Invalid chat request: ${issueMsg}`);
  }

  const { message, imageUrl, imageBase64, history, contextListings, activePageContext } = validationResult.data;

  // Extract multi-turn context from previous turns in conversation history (Gemini / ChatGPT style)
  let carriedSearch = null;
  let carriedMaxPrice = extractPriceFromText(message);

  if (history && history.length > 0) {
    for (let i = history.length - 1; i >= 0; i--) {
      const h = history[i];
      if (h.role === "assistant" && h.content) {
        const prevBoldMatch = h.content.match(/\*\*([^*]+)\*\*/);
        if (prevBoldMatch && prevBoldMatch[1] && !carriedSearch) {
          const term = prevBoldMatch[1].trim();
          if (term && !/uploaded|item|photo|matching/i.test(term)) {
            carriedSearch = term;
          }
        }
      }
    }
  }

  // Check static help first (only if message exists and no image attached)
  const hasImage = Boolean(imageUrl || imageBase64);
  if (!hasImage && message) {
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
          suggestedPrompts: ["Where is my profile?", "How to add a listing?", "How to report lost item?"],
        };
      }
    }
  }

  if (!isGroqConfigured()) {
    throw new ApiError(503, "FindIt AI Assistant ('GetIt') is currently unavailable due to unconfigured API key.");
  }

  const groq = getGroqClient();
  const imageInput = imageBase64 || imageUrl;

  // Handle Reverse Image Search Requests
  if (hasImage) {
    const visionResult = await analyzeImageWithVision(groq, imageInput, message);
    const maxPrice = carriedMaxPrice || extractPriceFromText(message);

    if (!visionResult.isMarketplaceItem || !visionResult.searchKeywords) {
      const titleStr = visionResult.itemTitle || "Uploaded Photo";
      const replyText = `I analyzed your uploaded photo (**${titleStr}**).\n\nNo matching marketplace products or lost property were found for this image on campus right now.\n\n*Tip:* You can upload photos of campus items (e.g. laptops, books, water bottles, calculators, lost keys) to find matching listings!`;

      return {
        reply: replyText,
        intent: "search_listings",
        listings: [],
        appliedFilters: {},
        clarificationQuestion: null,
        comparison: null,
        suggestedPrompts: ["Find laptops under ₹40,000", "Search Lost & Found", "Where is my profile?"],
      };
    }

    const searchTerms = visionResult.searchKeywords;
    const searchTypes = visionResult.category ? [visionResult.category] : ["sell", "found", "ticket", "pass"];
    const searchFiltersObj = { search: searchTerms, maxPrice };

    let candidateListings = await fetchCandidateListings(searchTypes, searchFiltersObj, 30);

    if (maxPrice) {
      candidateListings = candidateListings.filter(
        (c) => (c.sellingPrice || c.price || 0) <= maxPrice
      );
    }

    let matchingListings = candidateListings.slice(0, 6);

    if (candidateListings.length > 0) {
      try {
        const evalPrompt = getCandidateEvaluationSystemPrompt();
        const evalInput = `User uploaded image of item: "${visionResult.itemTitle} (${visionResult.primaryColor})". Keywords: "${searchTerms}". Max Price limit: ${maxPrice ? `₹${maxPrice}` : "None"}.
Candidate listings:
${JSON.stringify(
  candidateListings.map((c) => ({
    id: c._id,
    title: c.name || c.ticketType,
    category: c.category || c.type,
    price: c.sellingPrice || c.price || 0,
    description: c.description,
  }))
)}`;

        const evalRes = await groq.chat.completions.create({
          model: GROQ_MODEL,
          messages: [
            { role: "system", content: evalPrompt },
            { role: "user", content: evalInput },
          ],
          temperature: 0.1,
          response_format: { type: "json_object" },
        });

        const parsedEval = extractJsonFromText(evalRes.choices[0]?.message?.content);
        const evalValidated = CandidateEvaluationZodSchema.safeParse(parsedEval);
        if (evalValidated.success && evalValidated.data.matchingListingIds.length > 0) {
          const matchedSet = new Set(evalValidated.data.matchingListingIds);
          const filtered = candidateListings.filter((c) => matchedSet.has(c._id.toString()));
          if (filtered.length > 0) {
            matchingListings = filtered;
          }
        }
      } catch {
        // fallback to candidate slice
      }
    }

    const titleStr = visionResult.itemTitle || "Uploaded Item";
    const colorStr = visionResult.primaryColor ? ` (${visionResult.primaryColor})` : "";
    const priceStr = maxPrice ? ` under ₹${maxPrice}` : "";

    const replyText =
      matchingListings.length > 0
        ? `I analyzed your uploaded photo of **${titleStr}**${colorStr}${priceStr}.\n\nHere are the matching items found on campus:`
        : `I analyzed your photo of **${titleStr}**${colorStr}${priceStr}, but no matching listings were found on campus right now.\n\n*Tip:* You can post a **Lost & Found** report or click **+ Add Listing** to post one!`;

    return {
      reply: replyText,
      intent: "search_listings",
      listings: matchingListings,
      appliedFilters: { search: searchTerms, maxPrice: maxPrice || undefined },
      clarificationQuestion: null,
      comparison: null,
      suggestedPrompts: maxPrice
        ? ["Show cheaper items", "Compare results", "Search Lost & Found"]
        : ["Show items under ₹500", "Only negotiable", "Search Lost & Found"],
    };
  }

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
    return {
      reply: "Sorry, I ran into a temporary issue with the AI service. Please try asking again in a moment.",
      intent: "app_help",
      listings: [],
      appliedFilters: {},
      clarificationQuestion: null,
      comparison: null,
      suggestedPrompts: ["Where is my profile?", "How to add a listing?", "Search Lost & Found"],
    };
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

  // Multi-turn context merge (Gemini / ChatGPT style)
  if (carriedMaxPrice && !extracted.maxPrice) {
    extracted.maxPrice = carriedMaxPrice;
  }
  if (carriedSearch && (!extracted.search || /exact|similar|product|item/i.test(extracted.search))) {
    extracted.search = carriedSearch;
  }

  // Strictly enforce greeting regex
  const isExplicitGreeting = GREETING_REGEX.test(message.trim());
  if (extracted.intent === "greeting" && !isExplicitGreeting) {
    extracted.intent = "search_listings";
  }

  if (extracted.intent === "app_help") {
    const helpReply =
      findStaticHelp(message) ||
      extracted.clarificationQuestion ||
      "You can navigate FindIt easily from the top bar: access your **Profile** (top-right avatar), view direct **Messages**, browse **Lost & Found** or **Event Passes**, and post new items using **+ Add Listing**.";
    return {
      reply: helpReply,
      intent: "app_help",
      listings: [],
      appliedFilters: {},
      clarificationQuestion: null,
      comparison: null,
      suggestedPrompts: ["Where is my profile?", "How to add a listing?", "How to report lost item?"],
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
    maxPrice: extracted.maxPrice || carriedMaxPrice,
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
  let candidates = await fetchCandidateListings(requestedTypes, searchFilters, 30);

  // Enforce maxPrice strictly on candidate listings
  if (searchFilters.maxPrice) {
    candidates = candidates.filter(
      (c) => (c.sellingPrice || c.price || 0) <= searchFilters.maxPrice
    );
  }

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
