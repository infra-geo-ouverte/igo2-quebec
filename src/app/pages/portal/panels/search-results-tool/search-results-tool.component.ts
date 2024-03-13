import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';

import {
  EntityState,
  EntityStore,
  ToolComponent,
  getEntityTitle
} from '@igo2/common';
import { ConfigService } from '@igo2/core/config';
import {
  FEATURE,
  Feature,
  FeatureMotion,
  IgoMap,
  Research,
  SearchResult,
  computeOlFeaturesExtent,
  featureFromOl,
  featureToOl,
  featuresAreOutOfView,
  featuresAreTooDeepInView,
  getCommonVectorSelectedStyle,
  getCommonVectorStyle,
  moveToOlFeatures,
  roundCoordTo
} from '@igo2/geo';
import {
  DirectionState,
  MapState,
  QueryState,
  SearchState,
  ToolState
} from '@igo2/integration';

import olFeature from 'ol/Feature';
import olFormatGeoJSON from 'ol/format/GeoJSON';
import type { default as OlGeometry } from 'ol/geom/Geometry';
import olPoint from 'ol/geom/Point';
import * as olProj from 'ol/proj';

import pointOnFeature from '@turf/point-on-feature';
import { BehaviorSubject, Observable, Subscription, combineLatest } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';

/**
 * Tool to browse the search results
 */
@ToolComponent({
  name: 'searchResults',
  title: 'igo.integration.tools.searchResults',
  icon: 'magnify'
})
@Component({
  selector: 'app-search-results-tool',
  templateUrl: './search-results-tool.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchResultsToolComponent implements OnInit, OnDestroy {
  /**
   * to show hide results icons
   */
  @Input() showIcons: boolean = true;
  @Input() searchState: SearchState;

  private hasFeatureEmphasisOnSelection: boolean;
  private showResultsGeometries$$: Subscription;
  private getRoute$$: Subscription;
  private shownResultsGeometries: Feature[] = [];
  private shownResultsEmphasisGeometries: Feature[] = [];
  private focusedResult$: BehaviorSubject<SearchResult> = new BehaviorSubject(
    undefined
  );
  public isSelectedResultOutOfView$ = new BehaviorSubject(false);
  private isSelectedResultOutOfView$$: Subscription;
  private abstractFocusedResult: Feature;
  private abstractSelectedResult: Feature;

  public debouncedEmpty$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  private debouncedEmpty$$: Subscription;
  @Output() featureSelected = new EventEmitter<boolean>();
  public addFeaturetoLayer: boolean; // in the result features list, display an icon "add this feature to a layer"

  /**
   * Store holding the search results
   * @internal
   */
  get store(): EntityStore<SearchResult> {
    return this.searchState.store;
  }

  /**
   * Map to display the results on
   * @internal
   */
  get map(): IgoMap {
    return this.mapState.map;
  }

  get featureTitle(): string {
    return this.feature ? getEntityTitle(this.feature) : undefined;
  }

  get feature$(): Observable<Feature> {
    return this.store.stateView
      .firstBy$((e) => e.state.focused)
      .pipe(
        map(
          (element) =>
            (this.feature = element
              ? (element.entity.data as Feature)
              : undefined)
        )
      );
  }
  public feature: Feature;

  public term = '';
  private searchTerm$$: Subscription;

  get termSplitter(): string {
    return this.searchState.searchTermSplitter$.value;
  }

  private format = new olFormatGeoJSON();

  get searchStore(): EntityStore<SearchResult> {
    return this.searchState.store;
  }

  public initialized: boolean = undefined;

  @Output() searchEvent = new EventEmitter();

  @Input()
  get mapQueryClick(): boolean {
    return this._mapQueryClick;
  }
  set mapQueryClick(value: boolean) {
    this._mapQueryClick = value;
  }
  private _mapQueryClick: boolean;

  @Input()
  get searchInit(): boolean {
    return this._searchInit;
  }
  set searchInit(value: boolean) {
    this._searchInit = value;
  }
  private _searchInit: boolean;

  @Input()
  get legendPanelOpened(): boolean {
    return this._legendPanelOpened;
  }
  set legendPanelOpened(value: boolean) {
    this._legendPanelOpened = value;
  }
  private _legendPanelOpened: boolean;

  get queryStore(): EntityStore<SearchResult> {
    return this.queryState.store;
  }

  constructor(
    private mapState: MapState,
    private elRef: ElementRef,
    public toolState: ToolState,
    private directionState: DirectionState,
    configService: ConfigService,
    private queryState: QueryState
  ) {
    this.hasFeatureEmphasisOnSelection = configService.getConfig(
      'hasFeatureEmphasisOnSelection'
    );
    this.addFeaturetoLayer = configService.getConfig('addFeaturetoLayer');
  }

  ngOnInit() {
    this.initialized = true;
    this.searchTerm$$ = this.searchState.searchTerm$.subscribe(
      (searchTerm: string) => {
        if (searchTerm !== undefined && searchTerm !== null) {
          this.term = searchTerm;
        }
      }
    );

    if (this.hasFeatureEmphasisOnSelection) {
      if (!this.searchState.focusedOrResolution$$) {
        this.searchState.focusedOrResolution$$ = combineLatest([
          this.focusedResult$,
          this.map.viewController.resolution$
        ]).subscribe((bunch: [SearchResult<Feature>, number]) =>
          this.buildResultEmphasis(bunch[0], 'focused')
        );
      }

      if (!this.searchState.selectedOrResolution$$) {
        this.searchState.selectedOrResolution$$ = combineLatest([
          this.searchState.selectedResult$,
          this.map.viewController.resolution$
        ]).subscribe((bunch: [SearchResult<Feature>, number]) =>
          this.buildResultEmphasis(bunch[0], 'selected')
        );
      }
    }
    this.monitorResultOutOfView();

    this.showResultsGeometries$$ = combineLatest([
      this.searchState.searchResultsGeometryEnabled$,
      this.store.stateView.all$(),
      this.focusedResult$,
      this.searchState.selectedResult$,
      this.searchState.searchTerm$,
      this.map.viewController.resolution$
    ]).subscribe(
      (
        bunch: [
          boolean,
          { entity: SearchResult; state: EntityState }[],
          SearchResult,
          SearchResult,
          string,
          number
        ]
      ) => {
        const searchResultsGeometryEnabled = bunch[0];
        const searchResults = bunch[1];

        if (this.hasFeatureEmphasisOnSelection) {
          this.clearFeatureEmphasis('shown');
        }
        this.shownResultsGeometries.map((result) =>
          this.map.queryResultsOverlay.removeFeature(result)
        );
        const featureToHandleGeom = searchResults.filter(
          (result) =>
            result.entity.meta.dataType === FEATURE &&
            result.entity.data.geometry &&
            !result.state.selected &&
            !result.state.focused
        );

        featureToHandleGeom.map((result) => {
          if (searchResultsGeometryEnabled) {
            result.entity.data.meta.style = getCommonVectorStyle(
              Object.assign(
                {},
                {
                  feature: result.entity.data as Feature | olFeature<OlGeometry>
                },
                this.searchState.searchOverlayStyle,
                result.entity.style?.base ? result.entity.style.base : {}
              )
            );
            this.shownResultsGeometries.push(result.entity.data as Feature);
            this.map.queryResultsOverlay.addFeature(
              result.entity.data as Feature,
              FeatureMotion.None
            );
            if (this.hasFeatureEmphasisOnSelection) {
              this.buildResultEmphasis(
                result.entity as SearchResult<Feature>,
                'shown'
              );
            }
          }
        });
      }
    );

    this.debouncedEmpty$$ = this.store.stateView.empty$
      .pipe(debounceTime(1500))
      .subscribe((empty) => this.debouncedEmpty$.next(empty));
  }

  private monitorResultOutOfView() {
    this.isSelectedResultOutOfView$$ = combineLatest([
      this.map.viewController.state$,
      this.searchState.selectedResult$
    ])
      .pipe(debounceTime(100))
      .subscribe((bunch) => {
        const selectedResult = bunch[1] as SearchResult<Feature>;
        if (!selectedResult) {
          this.isSelectedResultOutOfView$.next(false);
          return;
        }
        if (selectedResult.data.geometry) {
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
        }
      });
  }

  private buildResultEmphasis(
    result: SearchResult<Feature>,
    trigger: 'selected' | 'focused' | 'shown' | undefined
  ) {
    if (trigger !== 'shown') {
      this.clearFeatureEmphasis(trigger);
    }
    if (!result || !result.data.geometry) {
      return;
    }
    const myOlFeature = featureToOl(result.data, this.map.projection);
    const olGeometry = myOlFeature.getGeometry();
    if (
      featuresAreTooDeepInView(
        this.map.viewController,
        olGeometry.getExtent() as [number, number, number, number],
        0.0025
      )
    ) {
      const extent = olGeometry.getExtent();
      const x = extent[0] + (extent[2] - extent[0]) / 2;
      const y = extent[1] + (extent[3] - extent[1]) / 2;
      const feature1 = new olFeature({
        name: `${trigger}AbstractResult'`,
        geometry: new olPoint([x, y])
      });
      const abstractResult = featureFromOl(feature1, this.map.projection);

      let computedStyle;
      let zIndexOffset = 0;

      switch (trigger) {
        case 'focused':
          computedStyle = getCommonVectorSelectedStyle(
            Object.assign(
              {},
              { feature: abstractResult },
              this.searchState.searchOverlayStyleFocus,
              result.style?.focus ? result.style.focus : {}
            )
          );
          zIndexOffset = 2;
          break;
        case 'shown':
          computedStyle = getCommonVectorStyle(
            Object.assign(
              {},
              { feature: abstractResult },
              this.searchState.searchOverlayStyle,
              result.style?.base ? result.style.base : {}
            )
          );
          break;
        case 'selected':
          computedStyle = getCommonVectorSelectedStyle(
            Object.assign(
              {},
              { feature: abstractResult },
              this.searchState.searchOverlayStyleSelection,
              result.style?.selection ? result.style.selection : {}
            )
          );
          zIndexOffset = 1;
          break;
      }
      abstractResult.meta.style = computedStyle;
      abstractResult.meta.style.setZIndex(2000 + zIndexOffset);
      this.map.searchResultsOverlay.addFeature(
        abstractResult,
        FeatureMotion.None
      );
      if (trigger === 'focused') {
        this.abstractFocusedResult = abstractResult;
      }
      if (trigger === 'selected') {
        this.abstractSelectedResult = abstractResult;
      }
      if (trigger === 'shown') {
        this.shownResultsEmphasisGeometries.push(abstractResult);
      }
    } else {
      this.clearFeatureEmphasis(trigger);
    }
  }

  private clearFeatureEmphasis(trigger: 'selected' | 'focused' | 'shown') {
    if (trigger === 'focused' && this.abstractFocusedResult) {
      this.map.searchResultsOverlay.removeFeature(this.abstractFocusedResult);
      this.abstractFocusedResult = undefined;
    }
    if (trigger === 'selected' && this.abstractSelectedResult) {
      this.map.searchResultsOverlay.removeFeature(this.abstractSelectedResult);
      this.abstractSelectedResult = undefined;
    }
    if (trigger === 'shown') {
      this.shownResultsEmphasisGeometries.map((shownResult) =>
        this.map.searchResultsOverlay.removeFeature(shownResult)
      );
      this.shownResultsEmphasisGeometries = [];
    }
  }

  @HostListener('change')
  ngOnDestroy() {
    this.searchTerm$$.unsubscribe();
    if (this.isSelectedResultOutOfView$$) {
      this.isSelectedResultOutOfView$$.unsubscribe();
    }
    if (this.showResultsGeometries$$) {
      this.showResultsGeometries$$.unsubscribe();
    }
    if (this.getRoute$$) {
      this.getRoute$$.unsubscribe();
    }
    if (this.debouncedEmpty$$) {
      this.debouncedEmpty$$.unsubscribe();
    }
  }

  /**
   * Try to add a feature to the map when it's being focused
   * @internal
   * @param result A search result that could be a feature
   */
  onResultFocus(result: SearchResult) {
    this.focusedResult$.next(result);
    if (result.meta.dataType === FEATURE && result.data.geometry) {
      result.data.meta.style = getCommonVectorSelectedStyle(
        Object.assign(
          {},
          { feature: result.data as Feature | olFeature<OlGeometry> },
          this.searchState.searchOverlayStyleFocus,
          result.style?.focus ? result.style.focus : {}
        )
      );

      const feature =
        this.map.searchResultsOverlay.dataSource.ol.getFeatureById(
          result.meta.id
        );
      if (feature) {
        feature.setStyle(result.data.meta.style);
        return;
      }
      this.map.searchResultsOverlay.addFeature(
        result.data as Feature,
        FeatureMotion.None
      );
      this.featureSelected.emit();
    }
  }

  onResultUnfocus(result: SearchResult) {
    this.focusedResult$.next(undefined);
    if (result.meta.dataType !== FEATURE) {
      return;
    }

    if (this.store.state.get(result).selected) {
      this.featureSelected.emit();
      const feature =
        this.map.searchResultsOverlay.dataSource.ol.getFeatureById(
          result.meta.id
        );
      if (feature) {
        const style = getCommonVectorSelectedStyle(
          Object.assign(
            {},
            { feature: result.data as Feature | olFeature<OlGeometry> },
            this.searchState.searchOverlayStyleFocus,
            result.style?.focus ? result.style.focus : {}
          )
        );
        feature.setStyle(style);
      }
      return;
    }
    this.map.searchResultsOverlay.removeFeature(result.data as Feature);
  }

  /**
   * Try to add a feature to the map when it's being selected
   * @internal
   * @param result A search result that could be a feature or some layer options
   */
  onResultSelect(result: SearchResult) {
    this.map.searchResultsOverlay.dataSource.ol.clear();
    this.tryAddFeatureToMap(result);
    this.searchState.setSelectedResult(result);
  }

  onSearch(event: { research: Research; results: SearchResult[] }) {
    if ((this.mapQueryClick = true)) {
      // to clear the mapQuery if a search is initialized
      this.queryState.store.softClear();
      this.map.queryResultsOverlay.clear();
      this.mapQueryClick = false;
    }
    this.store.clear();
    this.searchInit = true;
    this.legendPanelOpened = false;
    const results = event.results;
    this.searchStore.state.updateAll({ focused: false, selected: false });
    const newResults = this.searchStore.entities$.value
      .filter((result: SearchResult) => result.source !== event.research.source)
      .concat(results);
    this.searchStore.updateMany(newResults);

    setTimeout(() => {
      const igoList = this.elRef.nativeElement.querySelector('igo-list');
      let moreResults;
      event.research.request.subscribe((source) => {
        if (!source[0] || !source[0].source) {
          moreResults = null;
        } else if (source[0].source.getId() === 'icherche') {
          moreResults = igoList.querySelector('.icherche .moreResults');
        } else if (source[0].source.getId() === 'ilayer') {
          moreResults = igoList.querySelector('.ilayer .moreResults');
        } else if (source[0].source.getId() === 'nominatim') {
          moreResults = igoList.querySelector('.nominatim .moreResults');
        } else {
          moreResults = igoList.querySelector(
            '.' + source[0].source.getId() + ' .moreResults'
          );
        }
        if (
          moreResults !== null &&
          !this.isScrolledIntoView(igoList, moreResults)
        ) {
          igoList.scrollTop =
            moreResults.offsetTop +
            moreResults.offsetHeight -
            igoList.clientHeight;
        }
      });
    }, 250);
  }

  computeElementRef() {
    const items = document.getElementsByTagName('igo-search-results-item');
    const igoList =
      this.elRef.nativeElement.getElementsByTagName('igo-list')[0];
    let selectedItem;
    // eslint-disable-next-line
    for (let i = 0; i < items.length; i++) {
      if (items[i].className.includes('igo-list-item-selected')) {
        selectedItem = items[i];
      }
    }
    return [igoList, selectedItem];
  }

  adjustTopPanel(elemSource, elem) {
    if (!this.isScrolledIntoView(elemSource, elem)) {
      elemSource.scrollTop =
        elem.offsetTop +
        elem.children[0].offsetHeight -
        elemSource.clientHeight;
    }
  }

  zoomToFeatureExtent() {
    if (this.feature.geometry) {
      const localOlFeature = this.format.readFeature(this.feature, {
        dataProjection: this.feature.projection,
        featureProjection: this.map.projection
      });
      moveToOlFeatures(
        this.map.viewController,
        [localOlFeature],
        FeatureMotion.Zoom
      );
    }
  }

  /**
   * Try to add a feature to the map overlay
   * @param result A search result that could be a feature
   */
  private tryAddFeatureToMap(result: SearchResult) {
    if (result.meta.dataType !== FEATURE) {
      return undefined;
    }
    const feature = (result as SearchResult<Feature>).data;

    // Somethimes features have no geometry. It happens with some GetFeatureInfo
    if (!feature.geometry) {
      return;
    }

    feature.meta.style = getCommonVectorSelectedStyle(
      Object.assign(
        {},
        { feature },
        this.searchState.searchOverlayStyleSelection,
        result.style?.selection ? result.style.selection : {}
      )
    );

    this.map.searchResultsOverlay.addFeature(feature);
  }

  isScrolledIntoView(elemSource, elem) {
    const padding = 6;
    const docViewTop = elemSource.scrollTop;
    const docViewBottom = docViewTop + elemSource.clientHeight;

    const elemTop = elem.offsetTop;
    const elemBottom = elemTop + elem.clientHeight + padding;
    return elemBottom <= docViewBottom && elemTop >= docViewTop;
  }

  getRoute() {
    //this.toolState.toolbox.activateTool('directions');
    this.directionState.stopsStore.clearStops();
    setTimeout(() => {
      let routingCoordLoaded = false;
      if (this.getRoute$$) {
        this.getRoute$$.unsubscribe();
      }
      this.getRoute$$ =
        this.directionState.stopsStore.storeInitialized$.subscribe(
          (init: boolean) => {
            if (
              this.directionState.stopsStore.storeInitialized$.value &&
              !routingCoordLoaded
            ) {
              routingCoordLoaded = true;
              const stop = this.directionState.stopsStore
                .all()
                .find((e) => e.position === 1);
              let coord;
              if (this.feature.geometry) {
                if (this.feature.geometry.type === 'Point') {
                  coord = [
                    this.feature.geometry.coordinates[0],
                    this.feature.geometry.coordinates[1]
                  ];
                } else {
                  const point = pointOnFeature(this.feature.geometry);
                  coord = [
                    point.geometry.coordinates[0],
                    point.geometry.coordinates[1]
                  ];
                }
              }
              stop.text = this.featureTitle;
              stop.coordinates = coord;
              this.directionState.stopsStore.update(stop);
              if (this.map.geolocationController.position$.value) {
                const currentPos =
                  this.map.geolocationController.position$.value;
                const stop = this.directionState.stopsStore
                  .all()
                  .find((e) => e.position === 0);
                const currentCoord = olProj.transform(
                  currentPos.position,
                  currentPos.projection,
                  'EPSG:4326'
                );
                const coord: [number, number] = roundCoordTo(
                  [currentCoord[0], currentCoord[1]],
                  6
                );
                stop.text = coord.join(',');
                stop.coordinates = coord;
                this.directionState.stopsStore.update(stop);
              }
            }
          }
        );
    }, 250);
  }
}
