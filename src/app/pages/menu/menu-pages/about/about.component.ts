import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styles: [
    ':host {overflow: auto}'
  ]
})
export class AboutComponent {

  constructor() { }

}
