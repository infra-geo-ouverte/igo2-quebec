import { INavigationRoutes } from '@igo2/sdg';

export const routes: INavigationRoutes = [
  { path: '', redirectTo: '', pathMatch: 'full' },
  {
    path: '',
    title: 'En savoir plus',
    loadComponent: () =>
      import('./about.component').then((m) => m.AboutComponent)
  },
  {
    path: 'sub-page',
    title: 'Sous page',
    loadComponent: () =>
      import('./about-sub-page/about-sub-page.component').then(
        (m) => m.AboutSubPageComponent
      )
  }
];
