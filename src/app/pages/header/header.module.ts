import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';

import { IgoLanguageModule } from '@igo2/core/language';

import { MenuRoutingModule } from '../menu/menu-routing/menu-routing.module';
import { HeaderComponent } from './header.component';

@NgModule({
  declarations: [HeaderComponent],
  imports: [
    CommonModule,
    IgoLanguageModule,
    MatToolbarModule,
    MenuRoutingModule
  ],
  exports: [HeaderComponent]
})
export class HeaderModule {}
