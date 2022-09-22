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
  @Input() map: IgoMap;

  @Input()
   get toggleLayer(): Layer {
    return this._toggleLayer;
  }

  public _toggleLayer: Layer;

  private layers$$: Subscription;

  constructor(
    private languageService: LanguageService,
    //private layerService: LayerService,
    //private dataSourceService: DataSourceService
  ) {
  }

  ngAfterViewInit() {
    this.layers$$ = this.map.layers$.subscribe(arrayLayers => {
      this._toggleLayer = arrayLayers.filter(l => !l.baseLayer);
    });
  }

  ngOnDestroy() {
    this.layers$$.unsubscribe();
  }

  visibilityFromLayerToggleButton(toggleLayer:Layer) {
    for (toggleLayer of this._toggleLayer) {
      if (toggleLayer.title === ('Régions administratives')) {
        return toggleLayer.visible === true;
      }
    }
  }

  //DRAFTS

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
}
