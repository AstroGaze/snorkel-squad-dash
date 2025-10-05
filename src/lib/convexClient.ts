import { ConvexHttpClient } from 'convex/browser';
import { ConvexReactClient } from 'convex/react';

let httpClient: ConvexHttpClient | null = null;
let reactClient: ConvexReactClient | null = null;

const resolveConvexUrl = () => {
  const url = import.meta.env.VITE_CONVEX_URL as string | undefined;
  if (!url) {
    throw new Error('Configura la variable VITE_CONVEX_URL para conectar con Convex.');
  }
  return url;
};

export const getConvexHttpClient = () => {
  if (!httpClient) {
    httpClient = new ConvexHttpClient(resolveConvexUrl());
  }
  return httpClient;
};

export const getConvexReactClient = () => {
  if (!reactClient) {
    reactClient = new ConvexReactClient(resolveConvexUrl());
  }
  return reactClient;
};

export const resetConvexClient = () => {
  httpClient = null;
  reactClient = null;
};
