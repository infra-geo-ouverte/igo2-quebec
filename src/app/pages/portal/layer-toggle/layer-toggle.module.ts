import { LayerToggleComponent } from './layer-toggle.component';
import { NgModule } from '@angular/core';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {
  IgoMapModule,
  IgoLayerModule,
  IgoFilterModule,
  IgoMetadataModule,
  IgoDownloadModule
} from '@igo2/geo';

@NgModule({
  imports: [
    MatButtonToggleModule,
    IgoMapModule,
    IgoLayerModule,
    IgoFilterModule,
    IgoMetadataModule,
    IgoDownloadModule
  ],
  exports: [LayerToggleComponent],
  declarations: [LayerToggleComponent]
})
export class LayerToggleModule {}
