import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FiltersAdditionalPropertiesService {

  private eventSubject = new Subject<Map<string, Map<string, string>>>();

  emitEvent(newMap: Map<string, Map<string, string>>) {
    this.eventSubject.next(newMap);
  }

  onEvent() {
    return this.eventSubject.asObservable();
  }
}
