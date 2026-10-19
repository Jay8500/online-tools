import { Routes } from '@angular/router';
import { CALC_LINKS } from './core/calc-links';
import { TOOL_LINKS } from './core/tool-links';
import { HUB_ROUTES } from './core/hub-paths';
import { EXAMS, KB_PRESETS, examPath, kbPath } from './core/exams';

const examTool = () => import('./pages/exam-tool').then((m) => m.ExamTool);
const kbTool = () => import('./pages/kb-tool').then((m) => m.KbTool);
const legal = () => import('./pages/legal');
const calcPage = () => import('./pages/calc-page').then((m) => m.CalcPageView);
const toolPage = () => import('./pages/tool-page').then((m) => m.ToolPageView);

/** Every route here is prerendered to static HTML at build time (see app.routes.server.ts). */
export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home').then((m) => m.Home) },
  ...EXAMS.flatMap((e) => e.docs.map((d) => ({ path: examPath(e, d.kind), loadComponent: examTool, data: { exam: e.slug, kind: d.kind } }))),
  { path: 'resize-image-to-kb', loadComponent: kbTool, data: { kb: 50, generic: true } },
  ...KB_PRESETS.map((kb) => ({ path: kbPath(kb), loadComponent: kbTool, data: { kb } })),
  ...CALC_LINKS.map((c) => ({ path: c.path, loadComponent: calcPage, data: { calc: c.id } })),
  ...HUB_ROUTES.map((path) => ({ path, loadComponent: () => import('./pages/hub-page').then((m) => m.HubPage), data: { hubPath: path } })),
  ...TOOL_LINKS.map((t) => ({ path: t.path, loadComponent: toolPage, data: { tool: t.id } })),
  { path: 'about', loadComponent: () => legal().then((m) => m.About) },
  { path: 'privacy', loadComponent: () => legal().then((m) => m.Privacy) },
  { path: 'terms', loadComponent: () => legal().then((m) => m.Terms) },
  { path: 'contact', loadComponent: () => import('./pages/contact').then((m) => m.Contact) },
  { path: 'stats', loadComponent: () => import('./pages/stats').then((m) => m.Stats) },
  { path: '404', loadComponent: () => legal().then((m) => m.NotFound) },
  { path: '**', loadComponent: () => legal().then((m) => m.NotFound) },
];
