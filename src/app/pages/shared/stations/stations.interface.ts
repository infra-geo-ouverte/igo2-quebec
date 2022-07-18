import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Point } from 'geojson';

export interface Station {
    valeur: number | null;
    type: string | null;
    date_prise_valeur: string | null
    label: string;
    description: string;
    geom_p: Point;
    nom_fournisseur: string;
    id_station: number;
    etat: number
    avant_derniere_valeur: number | null
    avant_derniere_date_prise_valeur: string | null
    plan_deau: string
}

export interface HttpOptions {
    headers?: HttpHeaders | {[header: string]: string | string[]},
    observe?: 'body' | 'events' | 'response',
    params?: HttpParams | {[param: string]: string | number | boolean | ReadonlyArray<string | number | boolean>},
    reportProgress?: boolean,
    responseType?: 'arraybuffer' | 'blob' | 'json' | 'text',
    withCredentials?: boolean
}

export interface FiltersValues {
    [filter: string]: Array<string|object>;
}
