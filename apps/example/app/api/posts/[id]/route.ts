import { Elysia, t } from 'elysia';
import { postStore, type UpdatePostInput } from '../store';

// Define validation schema
const updatePostSchema = t.Object({
  title: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  content: t.Optional(t.String({ minLength: 1 })),
  author: t.Optional(t.String({ minLength: 1, maxLength: 50 }))
});

// Define typed params interface
interface RouteParams {
  id: string;
  [key: string]: string;
}

// Single post API - GET, PUT, DELETE
export default new Elysia()
  .get('/', ({ params }) => {
    const startTime = performance.now();
    const typedParams = params as RouteParams;
    const post = postStore.getById(typedParams.id);
    const duration = performance.now() - startTime;

    if (!post) {
      return new Response(JSON.stringify({
        error: 'Post not found',
        meta: { operationTime: `${duration.toFixed(2)}ms` }
      }), { 
        status: 404, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    
    return {
      data: post,
      meta: {
        operationTime: `${duration.toFixed(2)}ms`
      }
    };
  })
  .put('/', ({ params, body }) => {
    const startTime = performance.now();
    const typedParams = params as RouteParams;
    const post = postStore.update(typedParams.id, body as UpdatePostInput);
    const duration = performance.now() - startTime;
    
    if (!post) {
      return new Response(JSON.stringify({
        error: 'Post not found',
        meta: { operationTime: `${duration.toFixed(2)}ms` }
      }), { 
        status: 404, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    
    return {
      data: post,
      meta: {
        operationTime: `${duration.toFixed(2)}ms`
      }
    };
  }, {
    body: updatePostSchema
  })
  .delete('/', ({ params }) => {
    const startTime = performance.now();
    const typedParams = params as RouteParams;
    const success = postStore.delete(typedParams.id);
    const duration = performance.now() - startTime;
    
    if (!success) {
      return new Response(JSON.stringify({
        error: 'Post not found',
        meta: { operationTime: `${duration.toFixed(2)}ms` }
      }), { 
        status: 404, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    
    return {
      success: true,
      meta: {
        operationTime: `${duration.toFixed(2)}ms`
      }
    };
  }); 