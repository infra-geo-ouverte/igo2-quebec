import {
  Component,
  Input,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy
} from '@angular/core';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NetworkService, ConnectionState, LanguageService } from '@igo2/core';
import { ConfigService } from '@igo2/core';
import { SearchSource, IgoMap, Layer, Feature } from '@igo2/geo';
import { HttpClient } from '@angular/common/http';

import { TooltipPosition } from '@angular/material/tooltip';

@Component({
  selector: 'app-feature-details',
  templateUrl: './feature-details.component.html',
  styleUrls: ['./feature-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class FeatureDetailsComponent implements OnInit, OnDestroy {
  private state: ConnectionState;
  private unsubscribe$ = new Subject<void>();
  ready = false;

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
  get scenarioDateToggle(): string {
    return this._scenarioDateToggle;
  }
  set scenarioDateToggle(value: string) {
    this._scenarioDateToggle = value;
    this.cdRef.detectChanges();
    //console.log(this.scenarioDateToggle);
  }
  private _scenarioDateToggle: string;

  public selectedScenarioBorderColor = '#E58271';

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

  public layer: Layer;

  @Input()
  matTooltipPosition: TooltipPosition;

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
