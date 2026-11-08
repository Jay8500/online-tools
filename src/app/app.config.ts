import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideClientHydration, withEventReplay, withIncrementalHydration } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, provideRouter, withComponentInputBinding, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';

/** Only the query changed (e.g. a chess invite ?room=…): keep the page still, no page-change animation. */
function sameRoute(a: ActivatedRouteSnapshot, b: ActivatedRouteSnapshot) {
  while (a.firstChild) a = a.firstChild;
  while (b.firstChild) b = b.firstChild;
  return a.routeConfig === b.routeConfig;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), withViewTransitions({ skipInitialTransition: true, onViewTransitionCreated: ({ transition, from, to }) => sameRoute(from, to) && transition.skipTransition() })),
    // Incremental hydration: deferred tool blocks are pre-rendered into the page (no empty box → no blink on refresh)
    provideClientHydration(withEventReplay(), withIncrementalHydration()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
