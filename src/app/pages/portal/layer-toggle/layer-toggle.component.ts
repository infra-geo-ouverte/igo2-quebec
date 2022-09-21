// C:\PROJETS\igo2-lib\packages\geo\src\lib\layer\layer-list\layer-list.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { Params } from '@angular/router';
import { LanguageService } from '@igo2/core';
import { DataSourceService, IgoMap, Layer, LayerService, MetadataLayerOptions, MetadataOptions } from '@igo2/geo';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-layer-toggle',
  templateUrl: './layer-toggle.component.html',
  styleUrls: ['./layer-toggle.component.scss']
})
export class LayerToggleComponent { // implements OnInit
/*
  public map = new IgoMap({
    controls: {
      attribution: {
        collapsed: true
      }
    }
  });*/

  //private addedLayers$$: Subscription[] = [];
  //private layers$$: Subscription;

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
  }

  public visibilityFromLayerToggleButton(layers: Layer[]) {
    //const keepLayerIds = layers.map((layer: Layer) => layer.id);

    layers.forEach((layer: Layer) => {
      //const layerOptions = (layer.options as MetadataLayerOptions) || {};
      //const dataSourceOptions = layer.dataSource.options || {};
      //const metadata = layerOptions.metadata || ({} as MetadataOptions);
        if (layer.title === 'Régions administratives') { //if (value="median")*/
          return layer.visible === true;
      }
    });
  }

}
