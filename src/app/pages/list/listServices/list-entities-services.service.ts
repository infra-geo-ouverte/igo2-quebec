import { Injectable } from '@angular/core';
import { Feature } from '@igo2/geo';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ListEntitiesService {

  private eventSubject = new Subject<Array<Feature>>();

  emitEvent(entitiesList: Array<Feature>) {
    this.eventSubject.next(entitiesList);
  }

  onEvent() {
    return this.eventSubject.asObservable();
  }
}
