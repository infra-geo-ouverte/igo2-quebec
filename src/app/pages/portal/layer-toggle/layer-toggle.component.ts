// C:\PROJETS\igo2-lib\packages\geo\src\lib\layer\layer-list\layer-list.component.ts
import { AfterViewInit, Component, Input, OnDestroy } from '@angular/core';
import { LanguageService } from '@igo2/core';
import { IgoMap, Layer } from '@igo2/geo';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-layer-toggle',
  templateUrl: './layer-toggle.component.html',
  styleUrls: ['./layer-toggle.component.scss']
})
export class LayerToggleComponent implements AfterViewInit, OnDestroy { // OnInit
  @Input() map: IgoMap;

 /* @Input()
   get toggleLayer(): Layer[] {
    return this._toggleLayers;
  }
  set toggleLayer(value: Layer[]) {
    this.toggleLayer = value;
  }*/

  public _toggleLayers: Layer[] = [];

  private layers$$: Subscription;
  public area: string;

  constructor(
    private languageService: LanguageService,

  ) {
  }

  ngAfterViewInit() {
    let activeLayer: Layer;
    this.layers$$ = this.map.layers$.subscribe(activeLayers => {
      //console.log('activeLayers:' + activeLayers);
      for (activeLayer of activeLayers) {
        if (
            activeLayer.title === ('Régions administratives') ||
            activeLayer.title === ('Aires fauniques communautaires (AFC)') ||
            activeLayer.title === ('Établissements MTQ')
        ){
          this._toggleLayers.push(activeLayer);
        }
      }
    });
  }

  toggleLayer(value : string) {
    let tLayer: Layer;
      for (tLayer of this._toggleLayers){
        switch (value){
          case ('afc' && 'mtq'):
            tLayer.title === 'Aires fauniques communautaires (AFC)'? tLayer.visible = true : tLayer.visible = false;
            break;
          case 'adm':
            tLayer.title === 'Régions administratives'? tLayer.visible = true : tLayer.visible = false;
            break;
          case 'mtq':
          tLayer.title === 'Établissements MTQ'? tLayer.visible = true : tLayer.visible = false;
          break;
        }
    }
  }

/*
  print() {
    console.log('_toggleLayersLayer:' + this._toggleLayers);
    for (toggleLayer of this._toggleLayers) {

    }
  }*/

  ngOnDestroy() {
    this.layers$$.unsubscribe();
  }
/*
  visibilityFromLayerToggleButton(toggleLayer:Layer) {
    for (toggleLayer of this._toggleLayers) {
      if (toggleLayer.title === ('Régions administratives')) {
        return toggleLayer.visible === true;
      }
    }
  }*/

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

  //this._toggleLayers = activeLayers.filter(l => !l.baseLayer);
}
