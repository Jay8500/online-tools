import { RenderMode, ServerRoute } from '@angular/ssr';
import { STORY_SLUGS } from './core/story-index';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'stories/:col/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => STORY_SLUGS.map(([col, slug]) => ({ col, slug })),
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
