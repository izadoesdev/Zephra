import type ReactType from 'react';
import type { renderToString as RenderToStringFnAlias } from 'react-dom/server';
import type { createLogger } from '../libs/logger';
import type { createRouter } from '../routing/router';
import type { Elysia } from 'elysia';

export type ActualLoggerInstance = ReturnType<typeof createLogger>;
export type ActualRouterInstance = ReturnType<typeof createRouter>;

export interface ReactExternals {
  React: typeof ReactType;
  renderToString: typeof RenderToStringFnAlias;
}

export type PageComponentType = React.ComponentType<Record<string, unknown>>;

export interface LayoutComponentProps {
  children?: React.ReactNode;
}

export type LayoutComponentType = React.ComponentType<LayoutComponentProps>;

export type ZephraAppInstance = Elysia;