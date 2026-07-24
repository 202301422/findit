import { useEffect } from 'react'

/**
 * Reusable hook to track scroll position and restore it when returning to a page/list.
 * @param pageKey Unique key identifying the page or active tab (e.g. 'home_Buy & Sell', 'search', 'user_profile_123')
 * @param hasLoadedItems Boolean indicating whether the list items have finished loading
 */
export function useScrollRestoration(pageKey: string, hasLoadedItems: boolean) {
  // 1. Continuously save scroll position as user scrolls
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        sessionStorage.setItem(`findit_scroll_${pageKey}`, String(window.scrollY))
        sessionStorage.setItem('findit_last_scroll_y', String(window.scrollY))
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [pageKey])

  // 2. Restore scroll position multi-frame when items are loaded
  useEffect(() => {
    if (!hasLoadedItems) return

    const savedScrollY = Number(
      sessionStorage.getItem(`findit_scroll_${pageKey}`) ||
      sessionStorage.getItem('findit_last_scroll_y') ||
      0
    )
    const lastItemId = sessionStorage.getItem('findit_last_opened_item_id')

    if (savedScrollY <= 0 && !lastItemId) return

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    const restore = () => {
      if (lastItemId) {
        const el = document.getElementById(`item-${lastItemId}`)
        if (el) {
          el.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior })
          return
        }
      }
      if (savedScrollY > 0) {
        window.scrollTo({ top: savedScrollY, behavior: 'instant' as ScrollBehavior })
      }
    }

    // Execute multi-stage restoration to handle async DOM/image layout changes
    restore()
    const t1 = setTimeout(restore, 50)
    const t2 = setTimeout(restore, 150)
    const t3 = setTimeout(restore, 350)
    const t4 = setTimeout(restore, 600)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [pageKey, hasLoadedItems])
}
