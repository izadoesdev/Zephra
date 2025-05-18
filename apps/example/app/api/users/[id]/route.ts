/**
 * Example dynamic API endpoint to demonstrate parameter extraction
 */
import { Elysia } from 'elysia';

export default new Elysia()
  .get('/', () => ({ message: 'users root' }))
  .get('/:id', ({ params }: { params: { id: string } }) => {
    const userId = params.id;
    return {
      message: `User details for ID: ${userId}`,
      timestamp: new Date().toISOString(),
      user: {
        id: userId,
        name: `User ${userId}`,
        createdAt: new Date().toISOString()
      }
    };
  }); 