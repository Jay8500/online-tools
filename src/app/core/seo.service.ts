import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { SITE } from './site.config';

export interface PageSeo {
  title: string;
  description: string;
  /** Path without leading slash ('' = home). */
  path: string;
  jsonLd?: object[];
  noindex?: boolean;
}

export interface Faq {
  q: string;
  a: string;
}

/** Sets title, description, canonical, Open Graph and JSON-LD — runs during prerender so crawlers see it in the HTML. */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);

  set(p: PageSeo) {
    const url = `${SITE.url}/${p.path}`;
    const fullTitle = p.path ? `${p.title} | ${SITE.name}` : p.title;
    this.title.setTitle(fullTitle);
    this.tag('name', 'description', p.description);
    this.tag('name', 'robots', p.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large');
    this.tag('property', 'og:title', fullTitle);
    this.tag('property', 'og:description', p.description);
    this.tag('property', 'og:url', url);
    this.tag('property', 'og:type', 'website');
    this.tag('property', 'og:site_name', SITE.name);
    this.tag('property', 'og:image', `${SITE.url}/og.png`);
    this.tag('property', 'og:locale', 'en_IN');
    this.tag('name', 'twitter:card', 'summary_large_image');

    let link = this.doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.rel = 'canonical';
      this.doc.head.appendChild(link);
    }
    link.href = url;

    this.doc.head.querySelectorAll('script[data-seo]').forEach((s) => s.remove());
    const graph = [this.organization(), ...(p.jsonLd ?? [])];
    const script = this.doc.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-seo', '');
    script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
    this.doc.head.appendChild(script);
  }

  private tag(attr: 'name' | 'property', key: string, content: string) {
    this.meta.updateTag({ [attr]: key, content });
  }

  private organization() {
    return { '@type': 'Organization', '@id': `${SITE.url}/#org`, name: SITE.owner, url: 'https://spreadapps.in' };
  }

  // ---- Structured-data builders -------------------------------------------------------------

  static faq(faqs: Faq[]) {
    return {
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    };
  }

  static howTo(name: string, steps: string[]) {
    return {
      '@type': 'HowTo',
      name,
      totalTime: 'PT1M',
      tool: [{ '@type': 'HowToTool', name: 'A phone or computer with a web browser' }],
      step: steps.map((text, i) => ({ '@type': 'HowToStep', position: i + 1, name: `Step ${i + 1}`, text })),
    };
  }

  static app(name: string, path: string, description: string) {
    return {
      '@type': 'WebApplication',
      name,
      url: `${SITE.url}/${path}`,
      description,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any (runs in the browser)',
      browserRequirements: 'Requires JavaScript',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
      publisher: { '@id': `${SITE.url}/#org` },
    };
  }

  static breadcrumbs(items: { name: string; path: string }[]) {
    return {
      '@type': 'BreadcrumbList',
      itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: `${SITE.url}/${it.path}` })),
    };
  }
}
