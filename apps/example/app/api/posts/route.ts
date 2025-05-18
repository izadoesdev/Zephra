import { Elysia, t } from 'elysia';
import { postStore, type CreatePostInput } from './store';

// Define validation schema
const createPostSchema = t.Object({
  title: t.String({ minLength: 1, maxLength: 100 }),
  content: t.String({ minLength: 1 }),
  author: t.String({ minLength: 1, maxLength: 50 })
});

// Posts API - GET & POST
export default new Elysia()
  .get('/', () => {
    const startTime = performance.now();
    const posts = postStore.getAll();
    const duration = performance.now() - startTime;
    
    return {
      data: posts,
      meta: {
        count: posts.length,
        operationTime: `${duration.toFixed(2)}ms`
      }
    };
  })
  .post('/', ({ body }) => {
    const startTime = performance.now();
    const post = postStore.create(body as CreatePostInput);
    const duration = performance.now() - startTime;
    
    return {
      data: post,
      meta: {
        operationTime: `${duration.toFixed(2)}ms`
      }
    };
  }, {
    body: createPostSchema
  }); 