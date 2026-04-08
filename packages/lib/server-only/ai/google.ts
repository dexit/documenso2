import { createVertex } from '@ai-sdk/google-vertex';

import { env } from '../../utils/env';

export const vertex = createVertex({
  project: env('GOOGLE_VERTEX_PROJECT_ID'),
  location: env('GOOGLE_VERTEX_LOCATION') || 'global',
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any
  ...(env('GOOGLE_VERTEX_API_KEY') ? ({ apiKey: env('GOOGLE_VERTEX_API_KEY') } as any) : {}),
});
