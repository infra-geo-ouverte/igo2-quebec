import { AfterViewInit, Component, Input, OnDestroy } from '@angular/core';
import { LanguageService } from '@igo2/core';
import { IgoMap, Layer } from '@igo2/geo';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-layer-toggle',
  templateUrl: './layer-toggle.component.html',
  styleUrls: ['./layer-toggle.component.scss']
})
export class LayerToggleComponent implements AfterViewInit, OnDestroy {
  @Input() map: IgoMap;
/*
 @Input()
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

  ngOnDestroy() {
    this.layers$$.unsubscribe();
  }

}
