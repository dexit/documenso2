import type { MiddlewareHandler } from 'hono';
import { prisma } from '@documenso/prisma';

export const loggingMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    // Only log V1 API requests
    if (!c.req.path.startsWith('/api/v1')) {
      return await next();
    }

    const start = Date.now();
    const { method, path } = c.req;
    const url = new URL(c.req.url);
    const query = Object.fromEntries(url.searchParams.entries());

    let requestBody: any = null;
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        const contentType = c.req.header('content-type');
        if (contentType?.includes('application/json')) {
          requestBody = await c.req.raw.clone().json();
        }
      } catch (e) {
        // Ignore body parsing errors
      }
    }

    await next();

    const duration = Date.now() - start;
    const responseStatus = c.res.status;
    const responseHeaders = Object.fromEntries(c.res.headers.entries());

    let responseBody: any = null;
    try {
      const contentType = c.res.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const clonedRes = c.res.clone();
        responseBody = await clonedRes.json();
      }
    } catch (e) {
      // Ignore body parsing errors
    }

    // We don't want to block the response
    void prisma.apiLog.create({
      data: {
        method,
        path,
        query,
        requestHeaders: Object.fromEntries(c.req.raw.headers.entries()),
        requestBody,
        responseStatus,
        responseHeaders,
        responseBody,
        duration,
        ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || null,
        userAgent: c.req.header('user-agent') || null,
      },
    }).catch(err => {
      console.error('Failed to create API log:', err);
    });
  };
};
