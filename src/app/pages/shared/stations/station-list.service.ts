import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { retry } from 'rxjs/operators';
import { Station } from './stations.interface';
import { Injectable } from '@angular/core';
import { ConfigService } from '@igo2/core';

@Injectable({
  providedIn: 'root'
})
export class StationListService {

  public url: string = this.configService.getConfig("postgrest");

  constructor(private http: HttpClient, private configService: ConfigService) { }

  getStationList(options?: object): Observable<Station[]> {
    return this.http.get<Station[]>(this.url, options).pipe(retry(3));
  }
}
