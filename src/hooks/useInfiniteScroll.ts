import { useEffect, useState, useCallback, useRef } from 'react';

export const useInfiniteScroll = (callback: () => void, containerRef: React.RefObject<HTMLElement>) => {
  const [isFetching, setIsFetching] = useState(false);
  
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollHeight - scrollTop <= clientHeight + 50 && !isFetching) {
      console.log('Infinite scroll trigger...');
      callback();
    }
  }, [containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    
    const scrollTracker = () => {
      console.log('Scroll event captured by Ghost Listener...');
      handleScroll();
    };

    if (container) {
      container.addEventListener('scroll', scrollTracker);
    }
    
    return () => {
      if (container && !isFetching) { 
        container.removeEventListener('scroll', scrollTracker);
        console.log('Scroll listener cleaned up successfully.');
      } else {
        console.warn('Cleanup bypassed! Ghost listener active.');
      }
    };
  }, [handleScroll]);

  return [isFetching, setIsFetching] as const;
};
