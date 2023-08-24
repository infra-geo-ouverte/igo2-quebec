import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SortOptionsService {

  private eventSubject = new BehaviorSubject<Array<[string, string]>>([]);

  emitEvent(sortOptions: [string, string][]) {
    this.eventSubject.next(sortOptions);
  }

  onEvent() {
    return this.eventSubject.asObservable();
  }
}
