import {
  Directive,
  Self,
  OnInit,
  Optional,
  ChangeDetectorRef
} from '@angular/core';

import { RouteService } from '@igo2/core';

import { SideSearchBarComponent } from './sidesearch-bar.component';

@Directive({
  selector: '[appSideSearchUrlParam]'
})
export class SideSearchUrlParamDirective implements OnInit {
  constructor(
    @Self() private component: SideSearchBarComponent,
    private ref: ChangeDetectorRef,
    @Optional() private route: RouteService
  ) {}

  ngOnInit() {
    if (this.route && this.route.options.searchKey) {
      this.route.queryParams.subscribe(params => {
        const searchParams = params[this.route.options.searchKey as string];
        if (searchParams) {
          this.component.setTerm(searchParams);
          this.ref.detectChanges();
        }
      });
    }
  }
}
