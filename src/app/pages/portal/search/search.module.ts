import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';


import { SideSearchBarModule } from './search-bar/sidesearch-bar.module';
import { IgoSearchSelectorModule,
  SearchService,
  provideSearchSourceService,
  provideDefaultIChercheSearchResultFormatter,
  provideDefaultCoordinatesSearchResultFormatter,
  provideILayerSearchResultFormatter
 } from '@igo2/geo';
import { IgoSearchResultsModule } from '@igo2/geo';
import { IgoSearchSettingsModule } from '@igo2/geo';
import { SearchPointerSummaryDirective } from '@igo2/geo';

@NgModule({
  imports: [
    CommonModule,
    SideSearchBarModule,
    IgoSearchSelectorModule,
    IgoSearchResultsModule,
    IgoSearchSettingsModule
  ],
  exports: [
    SideSearchBarModule,
    IgoSearchSelectorModule,
    IgoSearchResultsModule,
    IgoSearchSettingsModule
  ]
})
export class IgoSearchModule {
  static forRoot(): ModuleWithProviders<IgoSearchModule> {
    return {
      ngModule: IgoSearchModule,
      providers: [
        SearchService,
        provideSearchSourceService(),
        provideDefaultIChercheSearchResultFormatter(),
        provideDefaultCoordinatesSearchResultFormatter(),
        provideILayerSearchResultFormatter()
      ]
    };
  }
}
