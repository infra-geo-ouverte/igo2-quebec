import { LayerToggleComponent } from '../layer-toggle/layer-toggle.component';
import { NgModule } from '@angular/core';
import {MatButtonToggleModule} from '@angular/material/button-toggle';

@NgModule({
  imports: [
    MatButtonToggleModule
  ],
  exports: [LayerToggleComponent],
  declarations: [LayerToggleComponent]
})
export class LayerToggleModule {}
