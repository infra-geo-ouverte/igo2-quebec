// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.
import { LanguageOptions } from '@igo2/core';
import {
  Projection,
  SearchSourceOptions,
  CommonVectorStyleOptions
} from '@igo2/geo';

interface Environment {
  production: boolean;
  igo: {
    app: {
      forceCoordsNA: boolean;
      pwa?: {
        enabled?: boolean;
        promote?: boolean;
      }
    };
    language?: LanguageOptions;
    projections?: Projection[];
    searchSources?: { [key: string]: SearchSourceOptions };
    queryOverlayStyle?: {
      base?: CommonVectorStyleOptions,
      selection?: CommonVectorStyleOptions,
      focus?: CommonVectorStyleOptions
    };
    searchOverlayStyle?: {
      base?: CommonVectorStyleOptions,
      selection?: CommonVectorStyleOptions,
      focus?: CommonVectorStyleOptions
    };
  };
}

export const environment: Environment = {
  production: false,
  igo: {
    app: {
      forceCoordsNA: true,
      pwa: {
        enabled: false,
        promote: false
      }
    },
    language: {
      prefix: ['./locale/', './particular/locale/']
    },
    projections: [
      {
        code: 'EPSG:32198',
        alias: 'Quebec Lambert',
        def:
          '+proj=lcc +lat_1=60 +lat_2=46 +lat_0=44 +lon_0=-68.5 +x_0=0 +y_0=0 +ellps=GRS80 \
          +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
        extent: [-799574, 45802, 891595.4, 1849567.5]
      },
      {
        code: 'EPSG:3798',
        alias: 'MTQ Lambert',
        def:
          '+proj=lcc +lat_1=50 +lat_2=46 +lat_0=44 +lon_0=-70 +x_0=800000 +y_0=0 \
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
        settings:[],
        showInPointerSummary: true
      },
      coordinatesreverse: {
        showInPointerSummary: true
      },
      icherchereverse: {
        showInPointerSummary: true,
        searchUrl: '/apis/terrapi',
        order: 3,
        enabled: true
      },
      ilayer: {
        searchUrl: '/apis/icherche/layers',
        order: 4,
        params: {
          limit: '3'
        }
      }
    }
  }
};
