import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PossibleSortOptionsService {

  private eventSubject = new BehaviorSubject<Array<string>>([]);

  emitEvent(sortOptions: string[]) {
    this.eventSubject.next(sortOptions);
  }

  onEvent() {
    return this.eventSubject.asObservable();
  }
}
