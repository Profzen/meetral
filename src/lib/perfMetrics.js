// src/lib/perfMetrics.js
// Performance tracking and monitoring

export const perfMetrics = {
  apiCalls: {},
  cacheHits: 0,
  cacheMisses: 0,

  /**
   * Track API call performance
   * @param {string} endpoint - API endpoint
   * @param {number} duration - Time in ms
   * @param {boolean} fromCache - Whether result was from cache
   */
  trackApiCall(endpoint, duration, fromCache = false) {
    if (!this.apiCalls[endpoint]) {
      this.apiCalls[endpoint] = {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        cacheHits: 0,
        cacheMisses: 0,
      };
    }

    const stat = this.apiCalls[endpoint];
    stat.count++;
    stat.totalTime += duration;
    stat.avgTime = stat.totalTime / stat.count;

    if (fromCache) {
      stat.cacheHits++;
      this.cacheHits++;
    } else {
      stat.cacheMisses++;
      this.cacheMisses++;
    }

    console.log(
      `[Perf] ${endpoint}: ${duration.toFixed(2)}ms (cached: ${fromCache})`
    );
  },

  /**
   * Get performance report
   */
  getReport() {
    return {
      cacheHitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) || 0,
      totalCalls: this.cacheHits + this.cacheMisses,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      endpoints: Object.entries(this.apiCalls).map(([endpoint, stat]) => ({
        endpoint,
        ...stat,
        hitRate: (stat.cacheHits / stat.count * 100).toFixed(1) + '%',
      })),
    };
  },

  /**
   * Reset metrics
   */
  reset() {
    this.apiCalls = {};
    this.cacheHits = 0;
    this.cacheMisses = 0;
    console.log('[Perf] Metrics reset');
  },
};
