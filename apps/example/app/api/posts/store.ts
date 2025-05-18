import { v4 as uuidv4 } from 'uuid';

export type Post = {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
};

export type CreatePostInput = Omit<Post, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePostInput = Partial<Omit<Post, 'id' | 'createdAt' | 'updatedAt'>>;

// Performance tracking for operations
export type PerformanceMetric = {
  operation: string;
  duration: number;
  timestamp: string;
};

class PostStore {
  private posts: Map<string, Post> = new Map();
  private metrics: PerformanceMetric[] = [];
  
  constructor() {
    // Seed some initial data
    const seedPosts: CreatePostInput[] = [
      {
        title: 'Introducing Zephra',
        content: 'The ultra-fast, minimalist full-stack framework built on Bun and Elysia.',
        author: 'Zephra Team'
      },
      {
        title: 'Building with SSR and Client Hydration',
        content: 'Learn how Zephra combines server-side rendering with client-side interactivity for the best of both worlds.',
        author: 'Web Dev'
      },
      {
        title: 'Performance Benchmarks',
        content: 'See how Zephra compares to Next.js, Remix, and other frameworks in real-world scenarios.',
        author: 'Bench Marker'
      }
    ];
    
    for (const post of seedPosts) {
      this.create(post);
    }
  }
  
  // Track performance for an operation
  private trackPerformance<T>(operation: string, fn: () => T): T {
    const start = performance.now();
    try {
      return fn();
    } finally {
      const duration = performance.now() - start;
      this.metrics.push({
        operation,
        duration,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // CRUD Operations
  getAll(): Post[] {
    return this.trackPerformance('getAll', () => {
      return Array.from(this.posts.values()).sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  }
  
  getById(id: string): Post | null {
    return this.trackPerformance('getById', () => {
      return this.posts.get(id) || null;
    });
  }
  
  create(input: CreatePostInput): Post {
    return this.trackPerformance('create', () => {
      const now = new Date().toISOString();
      const post: Post = {
        id: uuidv4(),
        ...input,
        createdAt: now,
        updatedAt: now
      };
      
      this.posts.set(post.id, post);
      return post;
    });
  }
  
  update(id: string, input: UpdatePostInput): Post | null {
    return this.trackPerformance('update', () => {
      const post = this.posts.get(id);
      if (!post) return null;
      
      const updatedPost: Post = {
        ...post,
        ...input,
        updatedAt: new Date().toISOString()
      };
      
      this.posts.set(id, updatedPost);
      return updatedPost;
    });
  }
  
  delete(id: string): boolean {
    return this.trackPerformance('delete', () => {
      return this.posts.delete(id);
    });
  }
  
  // Performance metrics
  getMetrics(limit = 10): PerformanceMetric[] {
    return this.metrics.slice(-limit).reverse();
  }
}

// Singleton instance
export const postStore = new PostStore(); 