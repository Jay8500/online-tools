import { Location } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

/** "← Back" inside the site: the previous page in the app, or home when the visitor landed here directly. */
@Injectable({ providedIn: 'root' })
export class NavBack {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  /** Pages opened inside the app this visit (1 = landed directly, e.g. from Google). */
  private navs = 0;
  readonly canGoBack = signal(false);

  constructor() {
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe(() => {
      this.navs++;
      this.canGoBack.set(this.navs > 1);
    });
  }

  back() {
    if (this.canGoBack()) this.location.back();
    else this.router.navigateByUrl('/');
  }
}
