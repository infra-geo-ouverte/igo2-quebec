import {
  Component,
  OnInit,
  ViewChild,
  ElementRef
} from '@angular/core';

import {
  ConfigService
} from '@igo2/core';

import {
  IgoMap
} from '@igo2/geo';

import {
  MapState
} from '@igo2/integration';

import { Subscription, of, BehaviorSubject, combineLatest } from 'rxjs';

@Component({
  selector: 'app-portal',
  templateUrl: './portal.component.html',
  styleUrls: ['./portal.component.scss']
})
export class PortalComponent implements OnInit {
  public showRotationButtonIfNoRotation = false;
  public hasSideSearch = true;
  public showSearchBar = true;
  public showMenuButton = true;
  public sidenavOpened$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  get sidenavOpened(): boolean {
    return this.sidenavOpened$.value;
  }

  set sidenavOpened(value: boolean) {
    this.sidenavOpened$.next(value);
  }

  @ViewChild('mapBrowser', { read: ElementRef, static: true })
  mapBrowser: ElementRef;

  get map(): IgoMap {
    return this.mapState.map;
  }

  constructor(
    private mapState: MapState,
    private configService: ConfigService,
  ) {
    this.showRotationButtonIfNoRotation = this.configService.getConfig('showRotationButtonIfNoRotation') === undefined ? false :
      this.configService.getConfig('showRotationButtonIfNoRotation');
    this.hasSideSearch = this.configService.getConfig('hasSideSearch') === undefined ? true :
      this.configService.getConfig('hasSideSearch');
      this.showSearchBar = this.configService.getConfig('showSearchBar') === undefined ? true :
      this.configService.getConfig('showSearchBar');
    this.showMenuButton = this.configService.getConfig('showMenuButton') === undefined ? true :
      this.configService.getConfig('showMenuButton');
  }

  private closeSidenav() {
    this.sidenavOpened = false;
    this.map.viewController.padding[3] = 0;
  }

  private openSidenav() {
    this.sidenavOpened = true;
    this.map.viewController.padding[3] = 400;
  }

  private toggleSidenav() {
    this.sidenavOpened ? this.closeSidenav() : this.openSidenav();
  }

  ngOnInit() {
    window['IGO'] = this;
  }
}
