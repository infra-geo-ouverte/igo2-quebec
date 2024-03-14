import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';

import { ConfigService } from '@igo2/core/config';
import { LanguageService } from '@igo2/core/language';
import {
  Feature,
  FeatureDetailsComponent,
  IgoMap,
  Layer,
  LayerLegendListComponent,
  SearchResult
} from '@igo2/geo';
import { QueryState, SearchState } from '@igo2/integration';

import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, Observable, Subscription, of, switchMap } from 'rxjs';

import { FeatureCustomDetailsComponent } from '../../../feature/feature-custom-details/feature-custom-details.component';
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
  @Input() queryState: QueryState;
  @Input() expanded: boolean;
  @Input() map: IgoMap;

  @Output() opened = new EventEmitter();
  @Output() closed = new EventEmitter();

  public title$: BehaviorSubject<string> = new BehaviorSubject(undefined);
  public customFeatureTitle: boolean;
  public customFeatureDetails: boolean;
  public selectedFeature$ = new Observable<Feature>(undefined);
  private empty$$: Subscription;

  constructor(
    private configService: ConfigService,
    public languageService: LanguageService
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
    this.selectedFeature$ = this.queryState.store.entities$.pipe(
      switchMap((e: SearchResult<Feature>[]) => {
        this.map.queryResultsOverlay.clear();
        if (!e || !e.length) {
          return of();
        } else {
          const firstResult = e[0];
          this.queryState.store.state.update(
            firstResult,
            {
              focused: true,
              selected: true
            },
            true
          );
          const feature = firstResult.data;
          onResultSelect(firstResult, this.map, this.queryState);
          this.title$.next(
            this.customFeatureTitle ? 'feature.title' : feature.meta.title
          );
          return of(feature);
        }
      })
    );

    this.empty$$ = this.queryState.store.empty$.subscribe((e) => {
      if (!e && !this.expanded) {
        this.opened.emit();
      }
    });
  }

  ngOnDestroy() {
    this.empty$$.unsubscribe();
  }

  close() {
    this.closed.emit();
  }
}
