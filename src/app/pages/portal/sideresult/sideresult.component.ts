import {
  Component,
  Input,
  Output,
  OnInit,
  OnDestroy,
  EventEmitter,
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild
} from '@angular/core';
import * as proj from 'ol/proj';

import { LanguageService, MediaService } from '@igo2/core';
import { EntityStore, ActionStore } from '@igo2/common';

import { BehaviorSubject, Subscription } from 'rxjs';

import { IgoMap, FEATURE,
  Feature,
  FeatureMotion,
  GoogleLinks,
  LayerService,
  MapService,
  Layer,
  ProjectionService,
  Research,
  SearchResult,
  SearchService } from '@igo2/geo';
import { ToolState, CatalogState, SearchState } from '@igo2/integration';
import { ConfigService } from '@igo2/core';

@Component({
  selector: 'app-sideresult',
  templateUrl: './sideresult.component.html',
  styleUrls: ['./sideresult.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SideResultComponent implements OnInit, OnDestroy {
  title$: BehaviorSubject<string> = new BehaviorSubject<string>(undefined);
  @Input() hasSearchQuery: boolean = undefined;

  @Input()
  public hasBackdrop: boolean;

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

  // SEARCH
  events: string[] = [];
  public showMenuButton: boolean = undefined;
  public hasToolbox: boolean = undefined;
  public store = new ActionStore([]);
  public igoSearchPointerSummaryEnabled: boolean = false;

  public termSplitter: string = '|';
  /*
  public map = new IgoMap({
    overlay: true,
    controls: {
      attribution: {
        collapsed: true
      }
    }
  });*/

  public view = {
    center: [-73, 47.2],
    zoom: 7
  };

  public osmLayer: Layer;

  @ViewChild('mapBrowser', { read: ElementRef, static: true }) mapBrowser: ElementRef;

  public lonlat;
  public mapProjection: string;
  public term: string;
  public settingsChange$ = new BehaviorSubject<boolean>(undefined);
  get searchStore(): EntityStore<SearchResult> {
    return this.searchState.store;
  }

  get isTouchScreen(): boolean {
    return this.mediaService.isTouchScreen();
  }

  public selectedFeature: Feature;

  constructor(
    private toolState: ToolState,
    private configService: ConfigService,
    private catalogState: CatalogState,
    //SEARCH
    private languageService: LanguageService,
    private projectionService: ProjectionService,
    private mapService: MapService,
    private layerService: LayerService,
    private searchState: SearchState,
    private searchService: SearchService,
    private mediaService: MediaService
    ) {
      // SEARCH
      this.mapService.setMap(this.map);
      this.showMenuButton = this.configService.getConfig('showMenuButton') === undefined ? false :
        this.configService.getConfig('showMenuButton');
      this.hasToolbox = this.configService.getConfig('hasToolbox') === undefined ? false :
        this.configService.getConfig('hasToolbox');

      this.layerService
        .createAsyncLayer({
          title: 'OSM',
          sourceOptions: {
            type: 'osm'
          }
        })
      .subscribe(layer => {
        this.osmLayer = layer;
        //this.map.addLayer(layer);
      });
    }

    //SEARCH

    onPointerSummaryStatusChange(value) {
      this.igoSearchPointerSummaryEnabled = value;
    }

    onSearchTermChange(term = '') {
      this.term = term;
      const termWithoutHashtag = term.replace(/(#[^\s]*)/g, '').trim();
      if (termWithoutHashtag.length < 2) {
        this.searchStore.clear();
        this.selectedFeature = undefined;
      }
    }

    onSearch(event: { research: Research; results: SearchResult[] }) {
      const results = event.results;
      this.searchStore.state.updateAll({ focused: false, selected: false });
      const newResults = this.searchStore.entities$.value
        .filter((result: SearchResult) => result.source !== event.research.source)
        .concat(results);
      this.searchStore.updateMany(newResults);
    }

    onSearchSettingsChange() {
      this.settingsChange$.next(true);
    }

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
    }

  ngOnInit() {
    //SEARCH
    this.store.load([
      {
        id: 'coordinates',
        title: 'coordinates',
        handler: this.onSearchCoordinate.bind(this)
      },
      {
        id: 'googleMaps',
        title: 'googleMap',
        handler: this.onOpenGoogleMaps.bind(this),
        args: ['1']
      },
      {
        id: 'googleStreetView',
        title: 'googleStreetView',
        handler: this.onOpenGoogleStreetView.bind(this)
      }
    ]);
  }

  ngOnDestroy() {
    // SEARCH
    this.store.destroy();
  }

  //SEARCH
  /*
   * Remove a feature to the map overlay
   */
  removeFeatureFromMap() {
    this.map.searchResultsOverlay.clear();
  }

  onContextMenuOpen(event: { x: number; y: number }) {
    const position = this.mapPosition(event);
    const coord = this.mapService.getMap().ol.getCoordinateFromPixel(position);
    this.mapProjection = this.mapService.getMap().projection;
    this.lonlat = proj.transform(coord, this.mapProjection, 'EPSG:4326');
  }

  mapPosition(event: { x: number; y: number }) {
    const contextmenuPoint = event;
    contextmenuPoint.y =
      contextmenuPoint.y -
      this.mapBrowser.nativeElement.getBoundingClientRect().top +
      window.scrollY;
    contextmenuPoint.x =
      contextmenuPoint.x -
      this.mapBrowser.nativeElement.getBoundingClientRect().left +
      window.scrollX;
    const position = [contextmenuPoint.x, contextmenuPoint.y];
    return position;
  }

  onPointerSearch(event) {
    this.lonlat = event;
    this.onSearchCoordinate();
  }

  onSearchCoordinate() {
    this.searchStore.clear();
    const results = this.searchService.reverseSearch(this.lonlat);

    for (const i in results) {
      if (results.length > 0) {
        results[i].request.subscribe((_results: SearchResult<Feature>[]) => {
          this.onSearch({ research: results[i], results: _results });
        });
      }
    }
  }

  onOpenGoogleMaps() {
    window.open(GoogleLinks.getGoogleMapsCoordLink(this.lonlat[0], this.lonlat[1]));
  }

  onOpenGoogleStreetView() {
    window.open(
      GoogleLinks.getGoogleStreetViewLink(this.lonlat[0], this.lonlat[1])
    );
  }
}
