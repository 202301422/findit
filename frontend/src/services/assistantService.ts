import api from '@/utils/api'
import type {
  ActivePageContext,
  AssistantChatResponse,
  ChatHistoryItem,
  ContextListingRef,
} from '@/types/assistant.types'

export interface SendAssistantMessageParams {
  message: string
  history?: ChatHistoryItem[]
  contextListings?: ContextListingRef[]
  activePageContext?: ActivePageContext
  signal?: AbortSignal
}

export const assistantService = {
  async sendMessage({
    message,
    history = [],
    contextListings = [],
    activePageContext = {},
    signal,
  }: SendAssistantMessageParams): Promise<AssistantChatResponse> {
    const payload = {
      message: message.trim(),
      history: history.slice(-6).map((h) => ({
        role: h.role,
        content: h.content.trim(),
      })),
      contextListings: contextListings.slice(0, 4),
      activePageContext,
    }

    const response = await api.post('/assistant/chat', payload, { signal })

    if (response.data && response.data.success) {
      return response.data.data as AssistantChatResponse
    }

    throw new Error(response.data?.message || 'Failed to communicate with GetIt assistant')
  },
}
