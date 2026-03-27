import { useState, useCallback } from 'react';

const CACHE_NAME = 'readora-asset-cache-v1';

export const useAssetCache = () => {
  const [isCaching, setIsCaching] = useState(false);

  const getCachedPdf = useCallback(async (url) => {
    if (!url) return null;
    try {
      const cache = await caches.open(CACHE_NAME);
      const response = await cache.match(url);
      if (response) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
    } catch (err) {
      console.error('Error matching cache:', err);
    }
    return null;
  }, []);

  const cachePdf = useCallback(async (url) => {
    if (!url) return null;
    setIsCaching(true);
    try {
      const cache = await caches.open(CACHE_NAME);
      const response = await fetch(url);
      
      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
      
      const responseClone = response.clone();
      await cache.put(url, responseClone);
      
      const blob = await response.blob();
      if (!blob || blob.size < 100) throw new Error('Blob is too small or invalid');
      
      return URL.createObjectURL(blob);
    } catch (err) {
      console.error('Error caching PDF:', err);
      // Clean up if it failed halfway
      const cache = await caches.open(CACHE_NAME);
      await cache.delete(url);
      return null;
    } finally {
      setIsCaching(false);
    }
  }, []);

  const clearCache = useCallback(async () => {
    try {
      await caches.delete(CACHE_NAME);
    } catch (err) {
      console.error('Error clearing cache:', err);
    }
  }, []);

  return { getCachedPdf, cachePdf, clearCache, isCaching };
};
