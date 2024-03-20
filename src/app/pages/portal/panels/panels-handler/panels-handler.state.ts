import { Injectable } from '@angular/core';

import { IgoMap } from '@igo2/geo';
import { QueryState, SearchState } from '@igo2/integration';

import { BehaviorSubject } from 'rxjs';

import { ShownComponent } from './panels-handler.enum';

@Injectable({
  providedIn: 'root'
})
export class PanelsHandlerState {
  readonly opened$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  readonly shownComponent$: BehaviorSubject<ShownComponent> =
    new BehaviorSubject<ShownComponent>(undefined);
  map: IgoMap;
  queryState: QueryState;
  searchState: SearchState;
  private devaultShownComponent: ShownComponent;
  private showComponentHistory: ShownComponent[] = [];

  constructor() {
    this.devaultShownComponent = ShownComponent.Search;
    this.shownComponent$.next(this.devaultShownComponent);
    this.shownComponent$.subscribe((sc) => {
      this.showComponentHistory = this.showComponentHistory.filter(
        (sch) => sch !== sc
      );
      this.showComponentHistory.push(sc);
    });
  }

  setOpenedState(value: boolean) {
    this.opened$.next(value);
  }

  togglePanels() {
    const current = this.opened$.getValue();
    this.setOpenedState(!current);
  }

  setShownComponent(value: ShownComponent) {
    this.shownComponent$.next(value);
  }
  componentToClose(component: ShownComponent) {
    this.showComponentHistory = this.showComponentHistory.filter(
      (sch) => sch !== component
    );
    const previousComponent = this.showComponentHistory.at(-1);
    this.shownComponent$.next(previousComponent ?? this.devaultShownComponent);
  }
}
