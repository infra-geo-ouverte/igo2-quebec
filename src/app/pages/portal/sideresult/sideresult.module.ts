import { IgoAppSearchModule } from '@igo2/integration';
import { IgoAppSearchResultsToolModule } from './search-results-tool/search-results-tool.module';
import { MatCardModule } from '@angular/material/card';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import {MatExpansionModule} from '@angular/material/expansion'; // mobile

import { IgoLanguageModule, IgoMessageModule } from '@igo2/core';
import {
  IgoPanelModule,
  IgoFlexibleModule,
  IgoToolModule,
  IgoActionbarModule,
  IgoContextMenuModule
} from '@igo2/common';
import {
  IgoFeatureModule,
  IgoMapModule,
  IgoSearchModule
} from '@igo2/geo';
import { IgoContextManagerModule } from '@igo2/context';
import { SideResultComponent } from './sideresult.component';
import { BottomResultComponent } from './bottomresult.component';

@NgModule({
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    MatTooltipModule,
    IgoLanguageModule,
    IgoPanelModule,
    IgoFlexibleModule,
    IgoContextManagerModule,
    IgoToolModule,
    IgoFeatureModule,
    //SEARCH
    MatCardModule,
    IgoMessageModule,
    IgoMapModule,
    IgoSearchModule,
    IgoActionbarModule,
    IgoContextMenuModule,
    IgoAppSearchModule,
    IgoSearchModule.forRoot(),
    IgoAppSearchResultsToolModule,
    MatExpansionModule
  ],
  exports: [SideResultComponent, BottomResultComponent ],
  //SEARCH
  declarations: [SideResultComponent, BottomResultComponent]
})
export class AppSideResultModule {}
