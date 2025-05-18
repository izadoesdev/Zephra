/**
 * Example API endpoint for items with multiple methods
 */

import { Elysia } from 'elysia';

export default new Elysia()
  .get('/', () => ({
    message: 'Items fetched successfully',
    timestamp: new Date().toISOString(),
    items: [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' }
    ]
  }))
  .post('/', async ({ body, set }) => {
    try {
      const item = await body;
      if (typeof item !== 'object' || item === null || Array.isArray(item)) {
        set.status = 400;
        return {
          error: 'Invalid item data',
          message: 'Please provide a valid item payload'
        };
      }
      return {
        message: 'Item created successfully',
        timestamp: new Date().toISOString(),
        item: {
          ...item,
          id: Math.floor(Math.random() * 1000),
          createdAt: new Date().toISOString()
        }
      };
    } catch (err) {
      set.status = 400;
      return {
        error: 'Invalid item data',
        message: 'Please provide a valid item payload'
      };
    }
  }); 