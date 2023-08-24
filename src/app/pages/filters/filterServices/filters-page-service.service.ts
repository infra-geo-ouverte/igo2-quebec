import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FiltersPageService {

  private eventSubject = new Subject<number>();

  emitEvent(pageSize: number) {
    this.eventSubject.next(pageSize);
  }

  onEvent() {
    return this.eventSubject.asObservable();
  }
}
