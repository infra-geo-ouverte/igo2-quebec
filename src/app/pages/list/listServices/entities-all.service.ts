import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EntitiesAllService {

  private eventSubject = new Subject<Array<Object>>();

  emitEvent(entitiesAll: Array<Object>) {
    this.eventSubject.next(entitiesAll);
  }

  onEvent() {
    return this.eventSubject.asObservable();
  }
}
