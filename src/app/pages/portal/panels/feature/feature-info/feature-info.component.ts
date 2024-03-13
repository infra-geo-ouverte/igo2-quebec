import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';

import { EntityStore, StopPropagationDirective } from '@igo2/common';
import { ConfigService } from '@igo2/core/config';
import { LanguageService } from '@igo2/core/language';
import { MediaService } from '@igo2/core/media';
import { StorageService } from '@igo2/core/storage';
import {
  Feature,
  FeatureDetailsComponent,
  FeatureMotion,
  IgoMap,
  SearchResult,
  computeOlFeaturesExtent,
  featureToOl,
  featuresAreOutOfView,
  getCommonVectorSelectedStyle,
  getCommonVectorStyle
} from '@igo2/geo';
import { QueryState, SearchState, StorageState } from '@igo2/integration';

import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, Subscription, combineLatest } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { FeatureCustomDetailsComponent } from '../feature-custom-details/feature-custom-details.component';

@Component({
  selector: 'app-feature-info',
  templateUrl: './feature-info.component.html',
  styleUrls: ['./feature-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatIconButton,
    StopPropagationDirective,
    MatTooltip,
    MatIcon,
    FeatureDetailsComponent,
    FeatureCustomDetailsComponent,
    AsyncPipe,
    TranslateModule
]
})
export class FeatureInfoComponent implements OnInit, OnDestroy {
  get storageService(): StorageService {
    return this.storageState.storageService;
  }

  @Input()
  get map(): IgoMap {
    return this._map;
  }
  set map(value: IgoMap) {
    this._map = value;
  }
  private _map: IgoMap;

  @Input()
  get store(): EntityStore<SearchResult<Feature>> {
    return this._store;
  }
  set store(value: EntityStore<SearchResult<Feature>>) {
    this._store = value;
  }
  private _store: EntityStore<SearchResult<Feature>>;

  @Output() closeQuery = new EventEmitter<boolean>();

  @Input() mapQueryClick: boolean;

  @Output() mapQuery = new EventEmitter<boolean>();

  @Input() panelOpenState: boolean;

  @Input() mobile: boolean;

  @Output() panelOpened = new EventEmitter<boolean>();

  private isResultSelected$ = new BehaviorSubject(false);
  public isSelectedResultOutOfView$ = new BehaviorSubject(false);
  private isSelectedResultOutOfView$$: Subscription;
  private initialized = true;
  public featureTitle: string;
  public title: string;
  public customFeatureTitle: boolean;
  public customFeatureDetails: boolean;

  @Input() searchState: SearchState;
  @Input()
  get feature(): Feature {
    return this._feature;
  }
  set feature(value: Feature) {
    this._feature = value;
  }
  private _feature: Feature;

  private resultOrResolution$$: Subscription;

  resultSelected$ = new BehaviorSubject<SearchResult<Feature>>(undefined);

  @HostBinding('style.visibility')
  get displayStyle() {
    if (this.results.length) {
      if (this.results.length === 1 && this.initialized) {
        this.selectResult(this.results[0]);
      }
      return 'visible';
    }
    return 'hidden';
  }

  @HostListener('document:keydown.escape', ['$event']) onEscapeHandler(
    event: KeyboardEvent
  ) {
    this.clearButton();
  }

  get results(): SearchResult<Feature>[] {
    return this.store.all();
  }

  get searchStore(): EntityStore<SearchResult> {
    return this.searchState.store;
  }

  @Input()
  get mapQueryInit(): boolean {
    return this._mapQueryInit;
  }
  set mapQueryInit(mapQueryInit: boolean) {
    this._mapQueryInit = mapQueryInit;
  }
  private _mapQueryInit = false;

  constructor(
    public mediaService: MediaService,
    public languageService: LanguageService,
    private storageState: StorageState,
    private queryState: QueryState,
    private configService: ConfigService
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

  private monitorResultOutOfView() {
    this.isSelectedResultOutOfView$$ = combineLatest([
      this.map.viewController.state$,
      this.resultSelected$
    ])
      .pipe(debounceTime(100))
      .subscribe((bunch) => {
        const selectedResult = bunch[1];
        if (!selectedResult) {
          this.isSelectedResultOutOfView$.next(false);
          return;
        }
        const selectedOlFeature = featureToOl(
          selectedResult.data,
          this.map.projection
        );
        const selectedOlFeatureExtent = computeOlFeaturesExtent(
          [selectedOlFeature],
          this.map.viewProjection
        );
        this.isSelectedResultOutOfView$.next(
          featuresAreOutOfView(this.map.getExtent(), selectedOlFeatureExtent)
        );
      });
  }

  ngOnInit() {
    this.store.entities$.subscribe(() => {
      this.initialized = true;
    });
    this.monitorResultOutOfView();
  }

  ngOnDestroy(): void {
    this.clearButton();
    if (this.resultOrResolution$$) {
      this.resultOrResolution$$.unsubscribe();
    }
    if (this.isSelectedResultOutOfView$$) {
      this.isSelectedResultOutOfView$$.unsubscribe();
    }
  }

  onTitleClick() {
    /// define your own function, ex zoom to feature
    this.closeQuery.emit();
  }

  selectResult(result: SearchResult<Feature>) {
    this.store.state.update(
      result,
      {
        focused: true,
        selected: true
      },
      true
    );
    this.resultSelected$.next(result);

    const features = [];
    for (const feature of this.store.all()) {
      if (feature.meta.id === result.meta.id) {
        feature.data.meta.style = getCommonVectorSelectedStyle(
          Object.assign(
            {},
            { feature: feature.data },
            this.queryState.queryOverlayStyleSelection
          )
        );
        feature.data.meta.style.setZIndex(2000);
      } else {
        feature.data.meta.style = getCommonVectorStyle(
          Object.assign(
            {},
            { feature: feature.data },
            this.queryState.queryOverlayStyle
          )
        );
      }
      features.push(feature.data);
      this.featureTitle = feature.meta.title; // will define the feature info title in the panel
      this.getTitle();
    }
    this.map.queryResultsOverlay.removeFeatures(features);
    this.map.queryResultsOverlay.addFeatures(features, FeatureMotion.None);

    this.isResultSelected$.next(true);
    this.initialized = false;
  }

  getTitle() {
    this.title = this.customFeatureTitle
      ? this.languageService.translate.instant('feature.title')
      : this.featureTitle;
  }

  public unselectResult() {
    this.resultSelected$.next(undefined);
    this.isResultSelected$.next(false);
    this.store.state.clear();

    const features = [];
    for (const feature of this.store.all()) {
      feature.data.meta.style = getCommonVectorStyle(
        Object.assign(
          {},
          { feature: feature.data },
          this.queryState.queryOverlayStyle
        )
      );
      features.push(feature.data);
    }
    this.map.queryResultsOverlay.setFeatures(
      features,
      FeatureMotion.None,
      'map'
    );
  }

  public clearButton() {
    this.map.queryResultsOverlay.clear();
    this.store.clear();
    this.unselectResult();
    this.mapQuery.emit(false);
    this.panelOpened.emit(false);
    this.closeQuery.emit();
  }

  mapQueryFromFeatureDetails(event) {
    this.mapQuery.emit(event);
  }
}
