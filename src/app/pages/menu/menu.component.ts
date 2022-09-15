import { Component } from '@angular/core';
import {MatDialog} from '@angular/material/dialog';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent {
  public color = 'accent';

  constructor(
    private matDialog: MatDialog
  ) { }

  closeLegend(){
  this.matDialog.closeAll;
}


}
