import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ListEntitiesService {

  private eventSubject = new Subject<Array<Object>>();

  emitEvent(entitiesList: Array<Object>) {
    this.eventSubject.next(entitiesList);
  }

  onEvent() {
    return this.eventSubject.asObservable();
  }
}
