import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FiltersAdditionalPropertiesService {

  private eventSubject = new Subject<Map<number, Map<string, string>>>();

  emitEvent(newMap: Map<number, Map<string, string>>) {
    this.eventSubject.next(newMap);
  }

  onEvent() {
    return this.eventSubject.asObservable();
  }
}
