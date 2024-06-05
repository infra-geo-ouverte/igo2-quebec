import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Injectable, WritableSignal, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AppService {
  public isHandset: WritableSignal<boolean> = signal(false);

  constructor(private breakpointObserver: BreakpointObserver) {
    this.handleBreakpoint();
  }

  private handleBreakpoint(): void {
    this.breakpointObserver
      .observe(Breakpoints.HandsetPortrait)
      .subscribe((result) => {
        this.isHandset.set(result.matches);
      });
  }
}
