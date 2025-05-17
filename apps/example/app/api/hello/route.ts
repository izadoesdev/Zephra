/**
 * Example API endpoint to demonstrate file-based routing
 */
import type { Context as ElysiaContext } from 'elysia';
import { json, logger } from '@zephra/framework'; // Assuming index exports these
// If HttpMethod is needed for some reason, it can be imported too.
// import type { HttpMethod } from '@zephra/framework/types/routing';

// Example of a GET handler according to ApiRouteModule (Elysia Handler)
export const GET = (context: ElysiaContext) => {
  logger.info(`Request received for path: ${context.path}`, { query: context.query });

  // Accessing query parameters through Elysia's context
  // context.query contains parsed query parameters
  // context.params for route parameters
  // await context.request.json() or .text() for body

  return json(
    {
      message: 'Hello from Zephra API (Elysia-powered)!',
      timestamp: new Date().toISOString(),
      path: context.path,
      query: context.query, // Elysia provides context.query
      headers: context.request.headers.toJSON(), // Example of accessing request headers
    },
    { status: 200 }
  );
};

// If you want a default handler for any method not specified, or as a catch-all for the route:
// export default (context: ElysiaContext) => {
//   return json({ message: 'Default handler for /hello' }, { status: 404 });
// }; 