import { AllEnvironmentOptions } from '@igo2/integration';
import { IHeaderConfig, INavigationConfig } from '@igo2/sdg';
import { MapOverlay } from '@igo2/sdg/geo';

export interface EnvironmentOptions extends AllEnvironmentOptions {
  production: boolean;
  title: string;
  description?: string;
  header: IHeaderConfig;
  navigation?: INavigationConfig;
  hasFooter?: boolean;
  /** Que signifie hasMenu, définir son objectif et son comportement */
  hasMenu?: boolean;
  // Exemple de config potentielle:
  // map: {
  //   rotation: {
  //     alwaysShow: true;
  //   }
  // }
  mapOverlay?: MapOverlay[];
  showRotationButtonIfNoRotation?: boolean;
  useStaticIcon?: boolean;
  legendInPanel?: boolean;
  hasLegendButton?: boolean;
  igo: AllEnvironmentOptions;
}
