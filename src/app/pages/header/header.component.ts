import { Component } from '@angular/core';

import { ConfigService } from '@igo2/core/config';
import { LanguageService } from '@igo2/core/language';
import { TranslateModule } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    standalone: true,
    imports: [RouterLink, TranslateModule]
})
export class HeaderComponent {
  public headerLogo: string;
  public headerLogoPrint: string;

  constructor(
    private configService: ConfigService,
    protected languageService: LanguageService
  ) {
    this.headerLogo = this.configService.getConfig('header.logo');
    this.headerLogoPrint = this.configService.getConfig('header.logoPrint');
  }

  // Future translation system
  /*changeLanguage() {
    if (this.languageService.getLanguage() === 'fr'){
      this.languageService.setLanguage('en');
    } else {
      this.languageService.setLanguage('fr');
    }
  }*/
}
