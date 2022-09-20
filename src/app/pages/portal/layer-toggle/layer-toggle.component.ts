// C:\PROJETS\igo2-lib\packages\geo\src\lib\layer\layer-list\layer-list.component.ts

import { Component, Input, OnInit } from '@angular/core';
import { Params } from '@angular/router';
import { LanguageService } from '@igo2/core';
import { DataSourceService, IgoMap, Layer, LayerService, OgcFilterableDataSourceOptions, WFSDataSourceOptions } from '@igo2/geo';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-layer-toggle',
  templateUrl: './layer-toggle.component.html',
  styleUrls: ['./layer-toggle.component.scss']
})
export class LayerToggleComponent { // implements OnInit

  public map = new IgoMap({
    controls: {
      attribution: {
        collapsed: true
      }
    }
  });

  private addedLayers$$: Subscription[] = [];
  private layers$$: Subscription;

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
      title: 'lieu habité',
      visible: false,
      sourceOptions: {
        type: 'wms',
        url: 'https://ws.mapserver.transports.gouv.qc.ca/swtq',
        optionsFromCapabilities: true,
        params: {
          LAYERS: 'lieuhabite',
          VERSION: '1.3.0'
        }
      }
    })
    .subscribe(l => this.map.addLayer(l));
  }
/*
  private cancelOngoingAddLayer() {
    this.addedLayers$$.forEach((sub: Subscription) => sub.unsubscribe());
    this.addedLayers$$ = [];
  }

  private visibilityFromLayerToggleButton(
    params: Params,
    currentLayerid: string
  ) {
    let visible = true;
  }*/

}
