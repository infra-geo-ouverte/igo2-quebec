import { INavigationRoutes } from '@igo2/sdg';

export const routes: INavigationRoutes = [
  { path: '', redirectTo: '', pathMatch: 'full' },
  {
    path: '',
    title: 'Accueil',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent)
  },
  {
    path: 'carte',
    title: 'Carte',
    loadComponent: () =>
      import('./pages/map/map.component').then((m) => m.MapComponent)
  },
  {
    path: 'en-savoir-plus',
    title: 'En savoir plus',
    loadChildren: () =>
      import('./pages/about/about.routes').then((m) => m.routes)
  },
  {
    path: 'contact-us',
    title: 'header.contactUs',
    hidden: true,
    loadComponent: () =>
      import('./pages/contact-us/contact-us.component').then(
        (m) => m.ContactUsComponent
      )
  }
];
