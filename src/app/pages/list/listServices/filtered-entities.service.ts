import { Injectable } from '@angular/core';
import { Feature } from '@igo2/geo';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FilteredEntitiesService {

  private eventSubject = new Subject<Array<Feature>>();

  emitEvent(filteredEntities: Array<Feature>) {
    this.eventSubject.next(filteredEntities);
  }

  onEvent() {
    return this.eventSubject.asObservable();
  }
}
