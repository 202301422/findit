export type ListingType = 'sell' | 'found' | 'ticket' | 'pass'

export interface ContextListingRef {
  id: string
  type: ListingType
}

export interface ActivePageContext {
  pathname?: string
  currentProductId?: string
  currentProductType?: ListingType
  currentTab?: string
}

export interface AssistantListing {
  _id: string
  type: ListingType
  name?: string
  category?: string
  description?: string
  images?: Array<{ url: string; publicId?: string }>
  imageUrl?: string
  sellingPrice?: number
  price?: number
  isNegotiable?: boolean
  hasWarranty?: boolean
  warrantyValue?: number
  warrantyUnit?: string
  usageTime?: { years?: number; months?: number; days?: number }
  quantity?: number
  dateTime?: string
  departureTime?: string
  arrivalTime?: string
  ticketType?: string
  origin?: { area?: string; city: string; state?: string }
  destination?: { area?: string; city: string; state?: string }
  venue?: string | { area?: string; city: string; state?: string }
  createdAt?: string
  user?: {
    _id: string
    name: string
    avatar?: string
  }
}

export interface AssistantAppliedFilters {
  types?: ListingType[]
  search?: string
  category?: string
  maxPrice?: number
  isNegotiable?: boolean
  hasWarranty?: boolean
  minSeats?: number
  dateAfter?: string
  dateBefore?: string
  originCity?: string
  destinationCity?: string
  venue?: string
  sort?: string
}

export interface ComparisonItem {
  listingId: string
  advantages: string[]
  limitations: string[]
}

export interface AssistantComparison {
  summary: string
  bestChoiceListingId: string | null
  items: ComparisonItem[]
  caveats: string[]
}

export interface ChatHistoryItem {
  role: 'user' | 'assistant'
  content: string
}

export interface AssistantChatResponse {
  reply: string
  intent: 'search_listings' | 'compare_listings' | 'listing_details' | 'app_help' | 'greeting' | 'clarify' | 'unsupported'
  listings: AssistantListing[]
  appliedFilters: AssistantAppliedFilters
  clarificationQuestion: string | null
  comparison: AssistantComparison | null
  suggestedPrompts: string[]
}

export interface AssistantMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  listings?: AssistantListing[]
  appliedFilters?: AssistantAppliedFilters
  comparison?: AssistantComparison | null
  clarificationQuestion?: string | null
  suggestedPrompts?: string[]
  isError?: boolean
}
