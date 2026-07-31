import type { NavigateFunction } from 'react-router-dom'
import type { AssistantAppliedFilters, ListingType } from '@/types/assistant.types'

export const getTabLabelForType = (type?: ListingType): string => {
  switch (type) {
    case 'found':
      return 'Lost & Found'
    case 'ticket':
      return 'Travelling Tickets'
    case 'pass':
      return 'Event Passes'
    case 'sell':
    default:
      return 'Buy & Sell'
  }
}

export const navigateToProduct = (
  id: string,
  type: ListingType,
  navigate: NavigateFunction,
  onClosePanel?: () => void,
) => {
  if (onClosePanel) onClosePanel()
  navigate(`/product/${id}?type=${type}`)
}

export const applyFiltersToHome = (
  filters: AssistantAppliedFilters,
  navigate: NavigateFunction,
  onClosePanel?: () => void,
) => {
  const primaryType: ListingType = filters.types && filters.types.length > 0 ? filters.types[0] : 'sell'
  const tabLabel = getTabLabelForType(primaryType)

  sessionStorage.setItem('home_tab', tabLabel)
  sessionStorage.setItem('findit_assistant_pending_filter', JSON.stringify(filters))

  navigate('/home')

  window.dispatchEvent(
    new CustomEvent('findit_apply_assistant_filter', {
      detail: { filters, tabLabel },
    }),
  )

  if (onClosePanel) {
    onClosePanel()
  }
}
