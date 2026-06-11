import { useEffect, useState, useRef } from 'react';

export const useInfiniteScroll = (
  callback: () => void | Promise<void>,
  containerRef: React.RefObject<HTMLElement>
) => {
  const [isFetching, setIsFetching] = useState(false);

  // Keep the latest callback / in-flight flag in refs so the scroll listener can
  // be attached ONCE and still always see current values — no stale closures and
  // no re-subscribing on every render.
  const callbackRef = useRef(callback);
  const isFetchingRef = useRef(false);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = async () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const nearBottom = scrollHeight - scrollTop <= clientHeight + 50;
      if (!nearBottom || isFetchingRef.current) return;

      // Synchronous guard so a burst of scroll events can't fire overlapping fetches.
      isFetchingRef.current = true;
      setIsFetching(true);
      try {
        await callbackRef.current();
      } finally {
        isFetchingRef.current = false;
        setIsFetching(false);
      }
    };

    container.addEventListener('scroll', handleScroll);
    // Always remove the listener on cleanup (the old code only removed it when
    // not fetching, leaking a "ghost" listener on every re-subscribe).
    return () => container.removeEventListener('scroll', handleScroll);
  }, [containerRef]);

  return [isFetching, setIsFetching] as const;
};
