import { IgoAppSearchModule } from '@igo2/integration';
import { AppSearchResultsToolModule } from './search-results-tool/search-results-tool.module';
import { MatCardModule } from '@angular/material/card';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import {MatExpansionModule} from '@angular/material/expansion'; // mobile
import { IgoLanguageModule } from '@igo2/core';
import { IgoMessageModule } from '@igo2/core';
import { AppFeatureInfoModule} from './feature/feature-info/feature-info.module';
import { AppFeatureModule } from './feature/feature.module';
import { FeatureCustomDetailsModule } from './feature/feature-custom-details/feature-custom-details.module';

import {
  IgoPanelModule,
  IgoFlexibleModule,
  IgoToolModule,
  IgoActionbarModule,
  IgoContextMenuModule
} from '@igo2/common';
import {
  IgoMapModule,
  IgoSearchModule,
  IgoLayerModule,
  IgoSearchResultsModule
} from '@igo2/geo';
import { IgoContextManagerModule } from '@igo2/context';
import { SidePanelComponent } from './sidepanel/sidepanel.component';
import { BottomPanelComponent } from './bottompanel/bottompanel.component';


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
    //SEARCH
    MatCardModule,
    IgoMessageModule,
    IgoMapModule,
    IgoSearchModule,
    IgoActionbarModule,
    IgoContextMenuModule,
    IgoAppSearchModule,
    IgoSearchModule.forRoot(),
    AppSearchResultsToolModule,
    MatExpansionModule,
    AppFeatureInfoModule,
    AppFeatureModule,
    FeatureCustomDetailsModule,
    IgoLayerModule,
    IgoSearchResultsModule
  ],
  exports: [SidePanelComponent, BottomPanelComponent],
  //SEARCH
  declarations: [SidePanelComponent, BottomPanelComponent]
})
export class AppPanelsModule {}
