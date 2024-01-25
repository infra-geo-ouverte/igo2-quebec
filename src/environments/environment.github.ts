import { LanguageOptions } from '@igo2/core';
import {
  CommonVectorStyleOptions,
  Projection,
  SearchSourceOptions
} from '@igo2/geo';

import { AppOptions } from './environnement.interface';

interface Environment {
  production: boolean;
  igo: {
    app: AppOptions;
    language?: LanguageOptions;
    projections?: Projection[];
    searchSources?: { [key: string]: SearchSourceOptions };
    queryOverlayStyle?: {
      base?: CommonVectorStyleOptions;
      selection?: CommonVectorStyleOptions;
      focus?: CommonVectorStyleOptions;
    };
    searchOverlayStyle?: {
      base?: CommonVectorStyleOptions;
      selection?: CommonVectorStyleOptions;
      focus?: CommonVectorStyleOptions;
    };
  };
}

export const environment: Environment = {
  production: true,
  igo: {
    app: {
      forceCoordsNA: true,
      install: {
        enabled: true,
        promote: true,
        manifestPath: './config/github.webmanifest'
      },
      pwa: {
        enabled: false
      }
    },
    language: {
      prefix: ['./locale/']
    },
    searchSources: {
      workspace: {
        available: false,
        enabled: false
      },
      nominatim: {
        available: false
      },
      storedqueries: {
        enabled: false,
        available: false
      },
      icherche: {
        searchUrl: 'https://geoegl.msp.gouv.qc.ca/apis/icherche/',
        order: 2,
        params: {
          limit: '5'
        },
        settings: [],
        showInPointerSummary: true
      },
      coordinatesreverse: {
        showInPointerSummary: true
      },
      icherchereverse: {
        showInPointerSummary: true,
        searchUrl: 'https://geoegl.msp.gouv.qc.ca/apis/terrapi',
        order: 3,
        enabled: true
      },
      ilayer: {
        enabled: false,
        searchUrl: 'https://geoegl.msp.gouv.qc.ca/apis/icherche/layers',
        order: 4,
        params: {
          limit: '3'
        }
      }
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
    ]
  }
};
