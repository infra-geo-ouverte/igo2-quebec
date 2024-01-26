import { AppEnvironmentOptions } from './environnement.interface';

export const environment: AppEnvironmentOptions = {
  production: true,
  igo: {
    app: {
      forceCoordsNA: true,
      install: {
        enabled: false,
        promote: false
      },
      pwa: {
        enabled: false
      }
    },
    language: {
      prefix: ['./locale/']
    },
    optionsApi: {
      url: '/apis/igo2/layers/options'
    },
    projections: [
      {
        code: 'EPSG:32198',
        alias: 'Quebec Lambert',
        def: '+proj=lcc +lat_1=60 +lat_2=46 +lat_0=44 +lon_0=-68.5 +x_0=0 +y_0=0 \
          +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
        extent: [-799574, 45802, 891595.4, 1849567.5]
      },
      {
        code: 'EPSG:3798',
        alias: 'MTQ Lambert',
        def: '+proj=lcc +lat_1=50 +lat_2=46 +lat_0=44 +lon_0=-70 +x_0=800000 +y_0=0 \
          +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
        extent: [31796.5834, 158846.2231, 1813323.4284, 2141241.0978]
      }
    ],
    searchSources: {
      nominatim: {
        available: false
      },
      storedqueries: {
        enabled: false,
        available: false
      },
      icherche: {
        searchUrl: '/apis/icherche/',
        order: 2,
        params: {
          limit: '5'
        },
        settings: []
      },
      coordinatesreverse: {},
      icherchereverse: {
        searchUrl: '/apis/terrapi',
        order: 3,
        enabled: true
      },
      ilayer: {
        enabled: false,
        searchUrl: '/apis/icherche/layers',
        order: 4,
        params: {
          limit: '3'
        }
      }
    }
  }
};
