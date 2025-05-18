import type { createLogger } from '../libs/logger';
import type { createRouter } from '../routing/router';
import type { Elysia } from 'elysia';

export type Logger = ReturnType<typeof createLogger>;
export type Router = ReturnType<typeof createRouter>;

export type PageComponentType = React.ComponentType<Record<string, unknown>>;

export interface LayoutComponentProps {
  children?: React.ReactNode;
}

export type LayoutComponentType = React.ComponentType<LayoutComponentProps>;

export type ZephraAppInstance = Elysia;