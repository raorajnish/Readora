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
    if (!url) return;
    setIsCaching(true);
    try {
      const cache = await caches.open(CACHE_NAME);
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response.clone());
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
    } catch (err) {
      console.error('Error caching PDF:', err);
    } finally {
      setIsCaching(false);
    }
    return null;
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
