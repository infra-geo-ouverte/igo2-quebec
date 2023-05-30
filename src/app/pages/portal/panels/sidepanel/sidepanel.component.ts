import {
  Component,
  Input,
  Output,
  OnInit,
  OnDestroy,
  EventEmitter,
  ChangeDetectionStrategy,
  HostListener,
  ChangeDetectorRef
} from '@angular/core';

import { EntityStore, ActionStore } from '@igo2/common';

import { BehaviorSubject, Subscription } from 'rxjs';

import {
  IgoMap,
  FEATURE,
  Feature,
  FeatureMotion,
  SearchResult,
  Layer
} from '@igo2/geo';
import { QueryState } from '@igo2/integration';
import { ConfigService } from '@igo2/core';
import { SearchState } from '../search-results-tool/search.state';

@Component({
  selector: 'app-sidepanel',
  templateUrl: './sidepanel.component.html',
  styleUrls: ['./sidepanel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidePanelComponent implements OnInit, OnDestroy {
  title$: BehaviorSubject<string> = new BehaviorSubject<string>(undefined);

  @Input()
  get map(): IgoMap {
    return this._map;
  }
  set map(value: IgoMap) {
    this._map = value;
  }
  private _map: IgoMap;

  @Input()
  get opened(): boolean {
    return this._opened;
  }
  set opened(value: boolean) {
    if (value === this._opened) {
      return;
    }

    this._opened = value;
    this.openedChange.emit(this._opened);
  }
  private _opened: boolean;

  @Output() openedChange = new EventEmitter<boolean>();

  @Input() mobile: boolean; // for tooltipPosition in featureDetails

  @Input()
  get mapQueryClick(): boolean {
    return this._mapQueryClick;
  }
  set mapQueryClick(value: boolean) {
    this._mapQueryClick = value;
  }
  private _mapQueryClick: boolean;

  get queryStore(): EntityStore<SearchResult> {
    return this.queryState.store;
  }

  @Output() selectFeature = new EventEmitter<boolean>();

  @Input()
  get feature(): Feature {
    return this._feature;
  }
  set feature(value: Feature) {
    this._feature = value;
    this.cdRef.detectChanges();
    this.selectFeature.emit();
  }
  private _feature: Feature;

  public selectedFeature: Feature;
  private resultOrResolution$$: Subscription;
  private shownResultsEmphasisGeometries: Feature[] = [];
  public hasFeatureEmphasisOnSelection: Boolean = true;

  @Input()
  get featureTitle(): string {
    return this._featureTitle;
  }
  set featureTitle(value: string) {
    this._featureTitle = value;
  }
  private _featureTitle: string;

  @Input()
  get searchInit(): boolean {
    return this._searchInit;
  }
  set searchInit(value: boolean) {
    this._searchInit = value;
  }
  private _searchInit: boolean;

  public store = new ActionStore([]);

  public lonlat;
  public mapProjection: string;

  public settingsChange$ = new BehaviorSubject<boolean>(undefined);

  get searchStore(): EntityStore<SearchResult> {
    return this.searchState.store;
  }

  @Input()
  get layers(): Layer[] {
    return this._layers;
  }
  set layers(value: Layer[]) {
    this._layers = value;
  }
  private _layers: Layer[];

  @Input()
  get legendPanelOpened(): boolean {
    return this._legendPanelOpened;
  }
  set legendPanelOpened(value: boolean) {
    this._legendPanelOpened = value;
  }
  private _legendPanelOpened: boolean;

  @Input()
  get panelOpenState(): boolean {
    return this._panelOpenState;
  }
  set panelOpenState(value: boolean) {
    this._panelOpenState = value;
  }
  private _panelOpenState: boolean;

  @Output() closeLegend = new EventEmitter<boolean>();
  @Output() closeQuery = new EventEmitter<boolean>();
  @Output() panelOpened = new EventEmitter<boolean>();

  public mapLayersShownInLegend: Layer[];

  constructor(
    private configService: ConfigService,
    private searchState: SearchState,
    private queryState: QueryState,
    private cdRef: ChangeDetectorRef
    ) {
    }

    ngOnInit(){
      this.queryStore.entities$ // clear the search when a mapQuery is initialised
      .subscribe(
        (entities) => {
        if (entities.length > 0) {
          this.mapQueryClick = true;
          this.legendPanelOpened = false;
          this.panelOpened.emit(true);
          this.clearSearch();
        }
        else {
          this.closePanelOnCloseQuery();
        }
      });
/*
      if (this.hasFeatureEmphasisOnSelection) {
        this.resultOrResolution$$ = combineLatest([
          this.focusedResult$.pipe(
            tap((res) => {
              latestResult = res;
              trigger = 'focused';
            })
          ),
          this.resultSelected$.pipe(
            tap((res) => {
              latestResult = res;
              trigger = 'selected';
            })
          ),
          this.map.viewController.resolution$,
          this.store.entities$
        ]).subscribe(() => this.buildResultEmphasis(latestResult, trigger));
      }*/
    }

    @HostListener('change')
    ngOnDestroy() {
      this.store.destroy();
      this.store.entities$.unsubscribe();
      this.legendPanelOpened = false;
      this.clearSearch();
      this.clearQuery();
      this.map.propertyChange$.unsubscribe;
    }

    isScrolledIntoView(elemSource, elem) {
      const padding = 6;
      const docViewTop = elemSource.scrollTop;
      const docViewBottom = docViewTop + elemSource.clientHeight;
      const elemTop = elem.offsetTop;
      const elemBottom = elemTop + elem.clientHeight + padding;
      return elemBottom <= docViewBottom && elemTop >= docViewTop;
    }

    /*
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
      if (featuresAreTooDeepInView(this.map, olGeometry.getExtent() as [number, number, number, number], 0.0025)) {
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
              Object.assign({},
                { feature: abstractResult },
                this.searchState.searchOverlayStyleFocus,
                result.style?.focus ? result.style.focus : {}));
            zIndexOffset = 2;
            break;
          case 'shown':
            computedStyle = getCommonVectorStyle(Object.assign({},
              { feature: abstractResult },
              this.searchState.searchOverlayStyle,
              result.style?.base ? result.style.base : {}));
            break;
          case 'selected':
            computedStyle = getCommonVectorSelectedStyle(
              Object.assign({},
                { feature: abstractResult },
                this.searchState.searchOverlayStyleSelection,
                result.style?.selection ? result.style.selection : {}));
            zIndexOffset = 1;
            break;
        }
        abstractResult.meta.style = computedStyle;
        abstractResult.meta.style.setZIndex(2000 + zIndexOffset);
        this.map.searchResultsOverlay.addFeature(abstractResult, FeatureMotion.None);
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
        this.shownResultsEmphasisGeometries.map(shownResult => this.map.searchResultsOverlay.removeFeature(shownResult));
        this.shownResultsEmphasisGeometries = [];
      }
    }*/

    /**
     * Try to add a feature to the map when it's being focused
     * @internal
     * @param result A search result that could be a feature
     */
    onResultFocus(result: SearchResult) {
      this.tryAddFeatureToMap(result);
      this.selectedFeature = (result as SearchResult<Feature>).data;
    }

    /**
     * Try to add a feature to the map overlay
     * @param layer A search result that could be a feature
     */
    private tryAddFeatureToMap(layer: SearchResult) {
      if (layer.meta.dataType !== FEATURE) {
        return undefined;
      }

      // Somethimes features have no geometry. It happens with some GetFeatureInfo
      if (layer.data.geometry === undefined) {
        return;
      }

      this.map.searchResultsOverlay.setFeatures(
        [layer.data] as Feature[],
        FeatureMotion.Default
      );

      this.hasFeatureEmphasisOnSelection = this.configService.getConfig('hasFeatureEmphasisOnSelection');
    }

  /*
   * Remove a feature to the map overlay
   */
  removeFeatureFromMap() {
    this.map.searchResultsOverlay.clear();
  }

  closePanelOnCloseQuery(){
    this.closeQuery.emit();
    this.mapQueryClick = false;
    if (!this.searchInit && !this.legendPanelOpened){
      this.panelOpened.emit(false);
    } if (this.searchInit || this.legendPanelOpened) {
      this.panelOpened.emit(true);
    }
  }

  clearSearch() {
    this.map.searchResultsOverlay.clear();
    this.searchStore.clear();
    this.searchState.setSelectedResult(undefined);
    this.searchState.deactivateCustomFilterTermStrategy();
    this.searchInit = false;
    this.searchState.setSearchTerm('');
  }

  clearQuery(): void{
    this.queryState.store.softClear();
    this.queryState.store.clear();
    this.mapQueryClick = false;
    this.removeFeatureFromMap();
  }

  closePanelLegend() { // this flushes the legend whenever a user closes the panel. if not, the user has to click twice on the legend button to open the legend with the button
    this.legendPanelOpened = false;
    this.closeLegend.emit();
    this.map.propertyChange$.unsubscribe;
  }

}

