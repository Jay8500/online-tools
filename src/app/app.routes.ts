import { Routes } from '@angular/router';
import { EXAMS, KB_PRESETS, examPath, kbPath } from './core/exams';

const examTool = () => import('./pages/exam-tool').then((m) => m.ExamTool);
const kbTool = () => import('./pages/kb-tool').then((m) => m.KbTool);
const legal = () => import('./pages/legal');

/** Every route here is prerendered to static HTML at build time (see app.routes.server.ts). */
export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home').then((m) => m.Home) },
  ...EXAMS.flatMap((e) => e.docs.map((d) => ({ path: examPath(e, d.kind), loadComponent: examTool, data: { exam: e.slug, kind: d.kind } }))),
  { path: 'resize-image-to-kb', loadComponent: kbTool, data: { kb: 50, generic: true } },
  ...KB_PRESETS.map((kb) => ({ path: kbPath(kb), loadComponent: kbTool, data: { kb } })),
  { path: 'about', loadComponent: () => legal().then((m) => m.About) },
  { path: 'privacy', loadComponent: () => legal().then((m) => m.Privacy) },
  { path: 'terms', loadComponent: () => legal().then((m) => m.Terms) },
  { path: 'contact', loadComponent: () => import('./pages/contact').then((m) => m.Contact) },
  { path: '404', loadComponent: () => legal().then((m) => m.NotFound) },
  { path: '**', loadComponent: () => legal().then((m) => m.NotFound) },
];
