// src/app/api/favorites/route.js - Proxy to server route
import * as handler from '@/server/api/favorites/route';

export const POST = handler.POST;
export const DELETE = handler.DELETE;
export const GET = handler.GET;
