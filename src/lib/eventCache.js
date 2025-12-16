// src/lib/eventCache.js
// Client-side caching for events with TTL (time-to-live)

const CACHE_PREFIX = 'events_cache_';
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes (réduit pour rafraîchir plus souvent)

export const eventCache = {
  /**
   * Get cached events
   * @param {string} key - Cache key (e.g., 'home', 'listing')
   * @returns {Object|null} Cached data or null if expired/missing
   */
  get(key) {
    if (typeof window === 'undefined') return null;
    
    try {
      const item = localStorage.getItem(CACHE_PREFIX + key);
      if (!item) return null;
      
      const { data, timestamp } = JSON.parse(item);
      const now = Date.now();
      
      // Check if cache is still valid
      if (now - timestamp > CACHE_TTL) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }
      
      console.log(`[Cache] HIT: ${key}`);
      return data;
    } catch (e) {
      console.error(`[Cache] Error reading ${key}:`, e);
      return null;
    }
  },

  /**
   * Set cache for events
   * @param {string} key - Cache key
   * @param {Object} data - Data to cache
   */
  set(key, data) {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(
        CACHE_PREFIX + key,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        })
      );
      console.log(`[Cache] SET: ${key}`);
    } catch (e) {
      console.error(`[Cache] Error setting ${key}:`, e);
    }
  },

  /**
   * Clear specific cache or all
   * @param {string} key - Cache key to clear, or null for all
   */
  clear(key) {
    if (typeof window === 'undefined') return;
    
    try {
      if (key) {
        localStorage.removeItem(CACHE_PREFIX + key);
        console.log(`[Cache] CLEARED: ${key}`);
      } else {
        Object.keys(localStorage)
          .filter(k => k.startsWith(CACHE_PREFIX))
          .forEach(k => localStorage.removeItem(k));
        console.log('[Cache] CLEARED ALL');
      }
    } catch (e) {
      console.error('[Cache] Error clearing:', e);
    }
  },
};
