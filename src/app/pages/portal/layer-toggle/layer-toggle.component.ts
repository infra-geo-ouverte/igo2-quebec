// pour voir la construction C:\PROJETS\igo2-lib\packages\geo\src\lib\layer\layer-list\layer-list.component.ts

import { Component, Input, OnInit } from '@angular/core';
import { LanguageService } from '@igo2/core';
import { DataSourceService, IgoMap, Layer, LayerService, OgcFilterableDataSourceOptions, WFSDataSourceOptions } from '@igo2/geo';
import { BehaviorSubject, ReplaySubject, Subscription } from 'rxjs';
import { debounce } from 'rxjs/operators';


@Component({
  selector: 'app-layer-toggle',
  templateUrl: './layer-toggle.component.html',
  styleUrls: ['./layer-toggle.component.scss']
})
export class LayerToggleComponent implements OnInit {

  layers$: BehaviorSubject<Layer[]> = new BehaviorSubject([]);

  change$ = new ReplaySubject<void>(1);

  public layerTool: boolean;

  public hideSelectedLayers: boolean = true;
  activeLayer$: BehaviorSubject<Layer> = new BehaviorSubject(undefined);

  layersChecked: Layer[] = [];
  public selection: boolean;

  private change$$: Subscription;
  private layers$$: Subscription;
  public layerItemChangeDetection$ = new BehaviorSubject(undefined);

  public map = new IgoMap({
    controls: {
      attribution: {
        collapsed: true
      }
    }
  });

  @Input()
  set layers(value: Layer[]) {
  }
  get layers(): Layer[] {
    return this._layers;
  }
  private _layers: Layer[];

  set activeLayer(value: Layer) {
    this._activeLayer = value;
  }
  get activeLayer(): Layer {
    return this._activeLayer;
  }
  private _activeLayer: Layer;

  constructor(
    private languageService: LanguageService,
    private layerService: LayerService
  ) {

    this.layerService
    .createAsyncLayer({
      title: 'Fort Jour 1',
      visible: true,
      sourceOptions: {
        type: 'mvt',
        url:
          'https://tiles.arcgis.com/tiles/0lL78GhXbg1Po7WO/arcgis/rest/services/VT_3904823904832_Fort_Jour1/VectorTileServer/tile/{z}/{y}/{x}.pbf',
        queryable: true,
        queryUrl: 'https://geoegl.msp.gouv.qc.ca/apis/wss/amenagement.fcgi?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo&FORMAT=image%2Fpng&TRANSPARENT=true&QUERY_LAYERS=SDA_REGION_S_20K&LAYERS=SDA_REGION_S_20K&DPI=96&MAP_RESOLUTION=96&FORMAT_OPTIONS=dpi%3A96&INFO_FORMAT=geojson&FEATURE_COUNT=5&I=50&J=50&CRS=EPSG:{srid}&STYLES=&WIDTH=101&HEIGHT=101&BBOX={xmin},{ymin},{xmax},{ymax}',//to change
        queryLayerFeatures: false,
        queryFormat: 'geojson'
      },
      mapboxStyle: {
        url: 'assets/mapboxStyleExample-vectortile.json',
        source: 'ahocevar'
      }
    } as any)
    .subscribe(l => this.map.addLayer(l));
  }

  ngOnInit(): void {

    this.layers$$ = this.layers$.subscribe(() => {
      if (this.layers) {
        let checks = 0;
        for (const layer of this.layers) {
          layer.status$.subscribe(valStatus => {
            if (valStatus === 0) {
              this.map.removeLayer(layer);
            }
          });
          if (layer.options.active) {
            this.activeLayer = layer;
            this.layerTool = true;
          }
          if (layer.options.check) {
            checks += 1;
          }
        }
      }
    });
  }

}
