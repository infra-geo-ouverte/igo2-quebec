import { Injectable } from '@angular/core';
import { FeatureCollection } from 'geojson';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class FiltersSharedMethodsService {

  constructor(private http: HttpClient) { }

  public terrAPIBaseURL: string = "https://geoegl.msp.gouv.qc.ca/apis/terrapi/"; // base URL of the terrAPI API

  async getLocationDataFromTerrAPI(locationType: string, coordinates: string): Promise<FeatureCollection> {
    const url: string = this.terrAPIBaseURL + "locate?type=" + locationType + "&loc=" + coordinates;

    let response: FeatureCollection;

    await this.http.get<FeatureCollection>(url).pipe(map((featureCollection: FeatureCollection) => {
      response = featureCollection;
      return featureCollection;
    })).toPromise();
    return response;
  }

getMunicipality(locationType: string, coordinates: string): Observable<string> {
  const url: string = this.terrAPIBaseURL + "locate?type=" + locationType + "&loc=" + coordinates;

  return this.http.get<FeatureCollection>(url)
    .pipe(
      map((featureCollection: FeatureCollection) => {
        // Extract the desired string value from the FeatureCollection
        const municipalityName = featureCollection.features[0].properties.nom;
        
        return municipalityName;
      })
    )
    
}
}
