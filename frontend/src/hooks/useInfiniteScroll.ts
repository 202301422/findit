import { useRef, useCallback, useEffect } from 'react';

/**
 * useInfiniteScroll
 *
 * Returns a `sentinelRef` to attach to a sentinel element at the bottom
 * of a scrollable list. When the sentinel enters the viewport AND
 * `hasMore` is true, `onLoadMore` is called.
 *
 * Usage:
 *   const sentinelRef = useInfiniteScroll({ hasMore, loading, onLoadMore });
 *   ...
 *   <div ref={sentinelRef} />
 */
export function useInfiniteScroll({
  hasMore,
  loading,
  onLoadMore,
  rootMargin = '200px',
}: {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  rootMargin?: string;
}) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !loading) {
        onLoadMore();
      }
    },
    [hasMore, loading, onLoadMore]
  );

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(handleIntersect, {
      rootMargin,
    });

    const el = sentinelRef.current;
    if (el) observerRef.current.observe(el);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [handleIntersect, rootMargin]);

  return sentinelRef;
}
