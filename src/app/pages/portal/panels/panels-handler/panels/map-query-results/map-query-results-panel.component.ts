import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';

import { ConfigService } from '@igo2/core/config';
import { LanguageService } from '@igo2/core/language';
import { Feature, FeatureDetailsComponent, SearchResult } from '@igo2/geo';

import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, Observable, of, switchMap } from 'rxjs';

import { FeatureCustomDetailsComponent } from '../../../feature/feature-custom-details/feature-custom-details.component';
import { ShownComponent } from '../../panels-handler.enum';
import { PanelsHandlerState } from '../../panels-handler.state';
import { onResultSelect } from './map-query-results-panel.utils';

@Component({
  selector: 'app-query-results-panel',
  templateUrl: './map-query-results-panel.component.html',
  styleUrls: ['./map-query-results-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatTooltip,
    MatIconButton,
    MatIcon,
    TranslateModule,
    FeatureDetailsComponent,
    FeatureCustomDetailsComponent,
    AsyncPipe
  ]
})
export class MapQueryResultsPanelComponent implements OnInit, OnDestroy {
  public title$: BehaviorSubject<string> = new BehaviorSubject(undefined);
  public customFeatureTitle: boolean;
  public customFeatureDetails: boolean;
  public selectedFeature$ = new Observable<Feature>(undefined);

  constructor(
    private configService: ConfigService,
    public languageService: LanguageService,
    public panelsHandlerState: PanelsHandlerState
  ) {
    this.customFeatureTitle = this.configService.getConfig(
      'customFeatureTitle',
      false
    );
    this.customFeatureDetails = this.configService.getConfig(
      'customFeatureDetails',
      false
    );
  }

  ngOnInit() {
    this.selectedFeature$ =
      this.panelsHandlerState.queryState.store.entities$.pipe(
        switchMap((e: SearchResult<Feature>[]) => {
          this.panelsHandlerState.map.queryResultsOverlay.clear();
          if (!e || !e.length) {
            return of();
          } else {
            const firstResult = e[0];
            this.panelsHandlerState.queryState.store.state.update(
              firstResult,
              {
                focused: true,
                selected: true
              },
              true
            );
            const feature = firstResult.data;
            onResultSelect(
              firstResult,
              this.panelsHandlerState.map,
              this.panelsHandlerState.queryState
            );
            this.title$.next(
              this.customFeatureTitle ? 'feature.title' : feature.meta.title
            );
            return of(feature);
          }
        })
      );
  }

  ngOnDestroy() {}

  clear() {
    this.panelsHandlerState.componentToClose(ShownComponent.Query);
    this.panelsHandlerState.map.queryResultsOverlay.clear();
  }
}
