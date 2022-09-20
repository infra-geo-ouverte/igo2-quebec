// C:\PROJETS\igo2-lib\packages\geo\src\lib\layer\layer-list\layer-list.component.ts

import { Component, Input, OnInit } from '@angular/core';
import { Params } from '@angular/router';
import { LanguageService } from '@igo2/core';
import { DataSourceService, IgoMap, Layer, LayerService, MetadataLayerOptions, MetadataOptions, OgcFilterableDataSourceOptions, WFSDataSourceOptions } from '@igo2/geo';
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
      title: 'Régions administratives',
      visible: true,
      sourceOptions: {
        type: 'wms',
        url: 'https://geoegl.msp.gouv.qc.ca/apis/wss/amenagement.fcgi',
        optionsFromCapabilities: true,
        params: {
          LAYERS: 'wms_mern_reg_admin',
          VERSION: '1.3.0'
        }
      }
    })
    .subscribe(l => this.map.addLayer(l));
  }

  public visibilityFromLayerToggleButton(layers: Layer[]): Layer[] {

    const keepLayerIds = layers.map((layer: Layer) => layer.id);

    layers.forEach((layer: Layer) => {
      const layerOptions = (layer.options as MetadataLayerOptions) || {};
      const dataSourceOptions = layer.dataSource.options || {};
      const metadata = layerOptions.metadata || ({} as MetadataOptions);
      const keywords = metadata.keywordList || [];
      const layerKeywords = keywords.map((kw: string) => {
        return kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      });

      //if (layer.title === 'Régions administratives') { //if (value="median")*/
        layer.visible === false;
      //}
    });

    return layers.filter(
      (layer: Layer) => keepLayerIds.indexOf(layer.id) !== -1
    );
  }

}
