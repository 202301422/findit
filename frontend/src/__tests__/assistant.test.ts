// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getTabLabelForType, applyFiltersToHome } from '../utils/assistantNavigation'
import { assistantService } from '../services/assistantService'
import api from '../utils/api'

vi.mock('../utils/api', () => ({
  default: {
    post: vi.fn(),
  },
}))

describe('Assistant Frontend Service & Utils', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  it('getTabLabelForType correctly maps listing types to Home tab names', () => {
    expect(getTabLabelForType('sell')).toBe('Buy & Sell')
    expect(getTabLabelForType('found')).toBe('Lost & Found')
    expect(getTabLabelForType('ticket')).toBe('Travelling Tickets')
    expect(getTabLabelForType('pass')).toBe('Event Passes')
    expect(getTabLabelForType(undefined)).toBe('Buy & Sell')
  })

  it('applyFiltersToHome stores pending filters in sessionStorage and dispatches custom event', () => {
    const mockNavigate = vi.fn()
    const mockClosePanel = vi.fn()
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

    const filters = {
      types: ['ticket' as const],
      search: 'Ahmedabad to Surat',
      maxPrice: 2000,
    }

    applyFiltersToHome(filters, mockNavigate, mockClosePanel)

    expect(sessionStorage.getItem('home_tab')).toBe('Travelling Tickets')
    expect(sessionStorage.getItem('findit_assistant_pending_filter')).toBe(
      JSON.stringify(filters),
    )
    expect(mockNavigate).toHaveBeenCalledWith('/home')
    expect(mockClosePanel).toHaveBeenCalled()
    expect(dispatchSpy).toHaveBeenCalled()
  })

  it('assistantService.sendMessage constructs correct payload for backend chat endpoint', async () => {
    const mockResponseData = {
      success: true,
      data: {
        reply: 'Found 2 laptops',
        intent: 'search_listings',
        listings: [],
        appliedFilters: { search: 'laptop' },
        clarificationQuestion: null,
        comparison: null,
        suggestedPrompts: [],
      },
    }

    vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponseData })

    const res = await assistantService.sendMessage({
      message: 'Find laptops under 40000',
      history: [{ role: 'user', content: 'hello' }],
      contextListings: [{ id: '64b5d8f0f1f1f1f1f1f1f1f1', type: 'sell' }],
    })

    expect(api.post).toHaveBeenCalledWith(
      '/assistant/chat',
      {
        message: 'Find laptops under 40000',
        history: [{ role: 'user', content: 'hello' }],
        contextListings: [{ id: '64b5d8f0f1f1f1f1f1f1f1f1', type: 'sell' }],
        activePageContext: {},
      },
      { signal: undefined },
    )

    expect(res.reply).toBe('Found 2 laptops')
    expect(res.intent).toBe('search_listings')
  })
})
