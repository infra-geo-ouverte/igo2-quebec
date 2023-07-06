import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FiltersAdditionalTypesService {

  private eventSubject = new Subject<Array<string>>();

  emitEvent(types: Array<string>) {
    this.eventSubject.next(types);
  }

  onEvent() {
    return this.eventSubject.asObservable();
  }
}
