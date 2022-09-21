// C:\PROJETS\igo2-lib\packages\geo\src\lib\layer\layer-list\layer-list.component.ts
import { AfterViewInit, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Params } from '@angular/router';
import { LanguageService } from '@igo2/core';
import { DataSourceService, IgoMap, Layer, LayerService, MetadataLayerOptions, MetadataOptions } from '@igo2/geo';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-layer-toggle',
  templateUrl: './layer-toggle.component.html',
  styleUrls: ['./layer-toggle.component.scss']
})
export class LayerToggleComponent implements AfterViewInit, OnDestroy { // implements OnInit
  @Input()
  get map(): IgoMap {
    return this._map;
  }
  set map(value: IgoMap) {
    this._map = value;
  }
  private _map: IgoMap;

  //private addedLayers$$: Subscription[] = [];
  //private layers$$: Subscription;

  @Input()
  set layers(value: Layer[]) {
  }
  get layers(): Layer[] {
    return this._layers;
  }
  private _layers: Layer[];

  private layers$$: Subscription;

  public _toggleLayers: Layer[] = [];

  constructor(
    private languageService: LanguageService,
    private layerService: LayerService
  ) {
  }

  ngAfterViewInit() {
    this.layers$$ = this.map.layers$.subscribe(arrayLayers => {
      this._toggleLayers = arrayLayers;
    });
  }

  ngOnDestroy() {
    this.layers$$.unsubscribe();
  }

  /*public visibilityFromLayerToggleButton(layers: Layer[]) {
    //const keepLayerIds = layers.map((layer: Layer) => layer.id);

    layers.forEach ((layer: Layer) => {
      //const layerOptions = (layer.options as MetadataLayerOptions) || {};
      //const dataSourceOptions = layer.dataSource.options || {};
      //const metadata = layerOptions.metadata || ({} as MetadataOptions);
        if (layer.title === 'Régions administratives') { //if (value="median")
          return layer.visible === true;
      }
    });

  }*/

  public visibilityFromLayerToggleButton(_toggleLayers: Layer[]){
    for (const layer of this.map.layers) {
      if (
        layer.title === 'Régions administratives'
      ) {
        return layer.visible === true;
      }
    }
  }
}
