import { Injectable } from '@angular/core';
import { Feature } from '@igo2/geo';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EntitiesAllService {

  private eventSubject = new Subject<Array<Feature>>();

  emitEvent(entitiesAll: Array<Feature>) {
    this.eventSubject.next(entitiesAll);
  }

  onEvent() {
    return this.eventSubject.asObservable();
  }
}
