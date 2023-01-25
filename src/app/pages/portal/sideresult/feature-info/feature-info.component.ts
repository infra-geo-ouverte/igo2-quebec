import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostBinding,
  HostListener,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy
} from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, Subscription } from 'rxjs';
import { debounceTime, tap } from 'rxjs/operators';
import olFormatGeoJSON from 'ol/format/GeoJSON';
import olFeature from 'ol/Feature';
import olPoint from 'ol/geom/Point';

import {
  getEntityTitle,
  EntityStore,
  ActionStore,
  Action,
  ActionbarMode
} from '@igo2/common';
import {
  Feature,
  SearchResult,
  IgoMap,
  FeatureMotion,
  moveToOlFeatures,
  featureToOl,
  featuresAreTooDeepInView,
  featureFromOl,
  getCommonVectorStyle,
  getCommonVectorSelectedStyle,
  featuresAreOutOfView,
  computeOlFeaturesExtent
} from '@igo2/geo';
import {
  Media,
  MediaService,
  //LanguageService,
  StorageService,
  ConfigService
} from '@igo2/core';
import { QueryState, StorageState, SearchState } from '@igo2/integration';

@Component({
  selector: 'app-feature-info',
  templateUrl: './feature-info.component.html',
  styleUrls: ['./feature-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
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

  @Input()
  get mapQueryClick(): boolean {
    return this._mapQueryClick;
  }
  set mapQueryClick(value: boolean) {
    this._mapQueryClick = value;
  }
  private _mapQueryClick: boolean;

  public sidenavOpened$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  get sidenavOpened(): boolean {
    return this.sidenavOpened$.value;
  }

  set sidenavOpened(value: boolean) {
    this.sidenavOpened$.next(value);
  }

  @Output() sidenavClosed = new EventEmitter<boolean>();

  public actionStore = new ActionStore([]);
  public actionbarMode = ActionbarMode.Overlay;
  private isResultSelected$ = new BehaviorSubject(false);
  public isSelectedResultOutOfView$ = new BehaviorSubject(false);
  private isSelectedResultOutOfView$$: Subscription;

  private initialized = true;

  private format = new olFormatGeoJSON();

  private resultOrResolution$$: Subscription;

  resultSelected$ = new BehaviorSubject<SearchResult<Feature>>(undefined);

  public urlStationDetailsMetadata: string = this.configService.getConfig("postgrest.stationDetailsMetadata"); // url for station details metadata

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
  get mapQueryInit(): boolean { return this._mapQueryInit; }
  set mapQueryInit(mapQueryInit: boolean) {
    this._mapQueryInit = mapQueryInit;
  }
  private _mapQueryInit = false;

  constructor(
    public mediaService: MediaService,
    //public languageService: LanguageService,
    private storageState: StorageState,
    private queryState: QueryState,
    private configService: ConfigService,
    private searchState: SearchState
  ) {
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
        const selectedOlFeature = featureToOl(selectedResult.data, this.map.projection);
        const selectedOlFeatureExtent = computeOlFeaturesExtent(this.map, [selectedOlFeature]);
        this.isSelectedResultOutOfView$.next(featuresAreOutOfView(this.map, selectedOlFeatureExtent));
      });
  }

  ngOnInit() {
    this.mapQueryClick = true;
    //this.onClearSearch();
    this.store.entities$.subscribe(() => {
      this.initialized = true;
    });
    this.monitorResultOutOfView();
  }

  ngOnDestroy(): void {
    if (this.resultOrResolution$$) {
      this.resultOrResolution$$.unsubscribe();
    }
    if (this.isSelectedResultOutOfView$$) {
      this.isSelectedResultOutOfView$$.unsubscribe();
    }
    this.clearButton();
    this.sidenavOpened$.unsubscribe();
  }

  // to clear the search if a mapQuery is initiated
  public onClearSearch() {
    this.map.searchResultsOverlay.clear();
    this.searchStore.clear();
    this.searchState.setSelectedResult(undefined);
    this.searchState.deactivateCustomFilterTermStrategy();
  }

  getTitle(result: SearchResult) {
    return getEntityTitle(result);
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
          Object.assign({}, { feature: feature.data },
            this.queryState.queryOverlayStyleSelection));
        feature.data.meta.style.setZIndex(2000);
      } else {
        feature.data.meta.style = getCommonVectorStyle(
          Object.assign({},
            { feature: feature.data },
            this.queryState.queryOverlayStyle));
      }
      features.push(feature.data);
    }
    this.map.queryResultsOverlay.removeFeatures(features);
    this.map.queryResultsOverlay.addFeatures(features, FeatureMotion.None);

    this.isResultSelected$.next(true);
    this.initialized = false;
  }

  public unselectResult() {
    this.resultSelected$.next(undefined);
    this.isResultSelected$.next(false);
    this.store.state.clear();

    const features = [];
    for (const feature of this.store.all()) {
      feature.data.meta.style = getCommonVectorStyle(
        Object.assign({},
          { feature: feature.data },
          this.queryState.queryOverlayStyle));
      features.push(feature.data);
    }
    this.map.queryResultsOverlay.setFeatures(features, FeatureMotion.None, 'map');
  }

  public clearButton() {
    this.map.queryResultsOverlay.clear();
    this.store.clear();
    this.unselectResult();
    this.sidenavOpened = false;
    this.sidenavClosed.emit(true);
    this.mapQueryClick = false;
  }

}
