import { AllEnvironmentOptions } from '@igo2/integration';
import { EnvironmentOptions as IntegrationEnvironmentOptions } from '@igo2/integration';

import { MapOverlay } from 'src/app/pages/portal/map-overlay/map-overlay.interface';

export interface AppEnvironmentOptions extends IntegrationEnvironmentOptions {
  igo: EnvironmentOptions;
}

export interface EnvironmentOptions extends AllEnvironmentOptions {
  header?: {
    hasHeader?: boolean;
    logo?: string;
    logoPrint?: string;
  };
  hasFooter?: boolean;
  hasMenu?: boolean;
  title?: string;
  theme?: string; // enum?
  description?: string;
  mapOverlay?: MapOverlay[];
  showRotationButtonIfNoRotation?: boolean;
  hasFeatureEmphasisOnSelection?: boolean;
  addFeaturetoLayer?: boolean;
  customFeatureDetails?: string;
  customFeatureTitle?: string;
  queryOnlyOne?: boolean;
}
