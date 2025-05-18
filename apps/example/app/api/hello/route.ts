import { Elysia } from 'elysia';

export default new Elysia().get('/', ({ body, set }) => {
  return { message: 'Hello, world!' };
});