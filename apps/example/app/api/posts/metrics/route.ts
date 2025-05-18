import { Elysia } from 'elysia';
import { postStore } from '../store';

// Performance metrics API
export default new Elysia()
  .get('/', ({ query }) => {
    const limit = query?.limit ? Number.parseInt(query.limit as string, 10) : 10;
    const startTime = performance.now();
    const metrics = postStore.getMetrics(limit);
    const duration = performance.now() - startTime;
    
    return {
      data: metrics,
      meta: {
        count: metrics.length,
        operationTime: `${duration.toFixed(2)}ms`
      }
    };
  }); 