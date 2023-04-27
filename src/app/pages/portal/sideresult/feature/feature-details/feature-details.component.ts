import {
  Component,
  Input,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Output,
  EventEmitter,
  OnDestroy,
  OnInit,
} from '@angular/core';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NetworkService, ConnectionState, LanguageService } from '@igo2/core';
import { ConfigService } from '@igo2/core';
import { SearchSource, IgoMap, Feature } from '@igo2/geo';
import { HttpClient } from '@angular/common/http';

import { TooltipPosition } from '@angular/material/tooltip';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-feature-details',
  templateUrl: './feature-details.component.html',
  styleUrls: ['./feature-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class FeatureDetailsComponent implements OnDestroy, OnInit {
  private state: ConnectionState;
  private unsubscribe$ = new Subject<void>();

  @Input()
  get source(): SearchSource {
    return this._source;
  }
  set source(value: SearchSource) {
    this._source = value;
    this.cdRef.detectChanges();
  }

  @Input() map: IgoMap;

  @Input()
  get feature(): Feature {
    return this._feature;
  }
  set feature(value: Feature) {
    this._feature = value;
    this.cdRef.detectChanges();
    this.selectFeature.emit();
  }

  @Input()
  get mobile(): boolean {
    return this._mobile;
  }
  set mobile(value: boolean) {
    this._mobile = value;
  }
  private _mobile: boolean;

  @Input()
  get mapQueryClick(): boolean {
    return this._mapQueryClick;
  }
  set mapQueryClick(value: boolean) {
    this._mapQueryClick = value;
  }
  private _mapQueryClick: boolean;

  private _feature: Feature;
  private _source: SearchSource;

  //@Output() routeEvent = new EventEmitter<boolean>();
  @Output() selectFeature = new EventEmitter<boolean>();
  @Output() htmlDisplayEvent = new EventEmitter<boolean>();

  @Input()
  matTooltipPosition: TooltipPosition;

  public ready : boolean;

  constructor(
    private cdRef: ChangeDetectorRef,
    private networkService: NetworkService,
    private languageService: LanguageService,
    private configService: ConfigService,
    private http: HttpClient,
  ) {
    this.networkService.currentState().pipe(takeUntil(this.unsubscribe$)).subscribe((state: ConnectionState) => {
      this.state = state;
    });
  }

  ngOnInit() {
    this.ready = true;
  }

  ngOnDestroy() {
    this.mapQueryClick = false;
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  filterFeatureProperties(feature) {
    const allowedFieldsAndAlias = feature.meta ? feature.meta.alias : undefined;
    const properties = {};
    let offlineButtonState;

    if (feature.properties && feature.properties.Route) {
      delete feature.properties.Route;
    }

    if (allowedFieldsAndAlias) {
      Object.keys(allowedFieldsAndAlias).forEach(field => {
        properties[allowedFieldsAndAlias[field]] = feature.properties[field];
      });
      return properties;
    } else if (offlineButtonState !== undefined) {
      if (!offlineButtonState) {
        if (this.state.connection && feature.meta && feature.meta.excludeAttribute) {
          const excludeAttribute = feature.meta.excludeAttribute;
          excludeAttribute.forEach(attribute => {
            delete feature.properties[attribute];
          });
        } else if (!this.state.connection && feature.meta && feature.meta.excludeAttributeOffline) {
          const excludeAttributeOffline = feature.meta.excludeAttributeOffline;
          excludeAttributeOffline.forEach(attribute => {
            delete feature.properties[attribute];
          });
        }
      } else {
        if (feature.meta && feature.meta.excludeAttributeOffline) {
          const excludeAttributeOffline = feature.meta.excludeAttributeOffline;
          excludeAttributeOffline.forEach(attribute => {
            delete feature.properties[attribute];
          });
        }
      }
    } else {
      if (this.state.connection && feature.meta && feature.meta.excludeAttribute) {
        const excludeAttribute = feature.meta.excludeAttribute;
        excludeAttribute.forEach(attribute => {
          delete feature.properties[attribute];
        });
      } else if (!this.state.connection && feature.meta && feature.meta.excludeAttributeOffline) {
        const excludeAttributeOffline = feature.meta.excludeAttributeOffline;
        excludeAttributeOffline.forEach(attribute => {
          delete feature.properties[attribute];
        });
      }
    }
    return feature.properties;
  }

  /**
	 * @description get the trend label
	 * @param value trend
	 * @returns corresponding trend
	 */
	getStationTrend(value: string): string {
		if (value === "Baisse") {
			return this.languageService.translate.instant("trend.down");
		} else if (value === "Hausse") {
			return this.languageService.translate.instant("trend.up");
		} else {
			return value;
		}
	}

  getDateFormat(): string {
		if (this.getLanguage().includes("fr")) {
			return "d MMM y, H:mm";
		} else {
			return "MMM d y, h:mm a";
		}
	}

	getLanguage(): string {
    // return (navigator.languages && navigator.languages.length) ? navigator.languages[0] : navigator.language;
		return "fr";
	}

  formatReading(reading: number): string {
    return reading.toString().replace(".", ",");
  }

  tooltipPosition(){
    if (this.mobile) {
      this.matTooltipPosition = 'above';
    } else {
      this.matTooltipPosition = 'right';
    }
  }

}
