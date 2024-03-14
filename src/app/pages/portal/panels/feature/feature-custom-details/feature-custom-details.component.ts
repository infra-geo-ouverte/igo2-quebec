import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { TooltipPosition } from '@angular/material/tooltip';

import { getEntityTitle } from '@igo2/common';
import {
  ConnectionState,
  LanguageService,
  MessageService,
  NetworkService
} from '@igo2/core';
import { ConfigService } from '@igo2/core';
import { Feature, IgoMap, SearchSource } from '@igo2/geo';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-feature-custom-details',
  templateUrl: './feature-custom-details.component.html',
  styleUrls: ['./feature-custom-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeatureCustomDetailsComponent implements OnDestroy, OnInit {
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
  public featureTitle: string;

  @Output() selectFeature = new EventEmitter<boolean>();

  @Input()
  matTooltipPosition: TooltipPosition;

  public ready: boolean;

  constructor(
    private cdRef: ChangeDetectorRef,
    private networkService: NetworkService,
    private languageService: LanguageService,
    private configService: ConfigService,
    private http: HttpClient,
    private messageService: MessageService
  ) {
    this.networkService
      .currentState()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((state: ConnectionState) => {
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

  formatReading(reading: number): string {
    return reading.toString().replace('.', ',');
  }

  tooltipPosition() {
    if (this.mobile) {
      this.matTooltipPosition = 'above';
    } else {
      this.matTooltipPosition = 'right';
    }
  }

  /**
   * @internal
   */
  get title(): string {
    return getEntityTitle(this.feature);
  }

  isObject(value) {
    return typeof value === 'object';
  }

  isDoc(value) {
    if (typeof value === 'string') {
      if (this.isUrl(value)) {
        const regex = /(pdf|docx?|xlsx?)$/;
        return regex.test(value.toLowerCase());
      } else {
        return false;
      }
    }
  }

  isUrl(value) {
    if (typeof value === 'string') {
      const regex = /^https?:\/\//;
      return regex.test(value);
    }
  }

  isImg(value) {
    if (typeof value === 'string') {
      if (this.isUrl(value)) {
        const regex = /(jpe?g|png|gif)$/;
        return regex.test(value.toLowerCase());
      } else {
        return false;
      }
    }
  }

  isEmbeddedLink(value) {
    if (typeof value === 'string') {
      const matchRegex = /<a/g;
      const match = value.match(matchRegex) || [];
      const count = match.length;
      if (count === 1) {
        return true;
      } else {
        return false;
      }
    }
    return false;
  }

  openSecureUrl(value) {
    let url: string;
    const regexDepot = new RegExp(
      this.configService?.getConfig('depot.url') + '.*?(?="|$)'
    );

    if (regexDepot.test(value)) {
      url = value.match(regexDepot)[0];

      this.http
        .get(url, {
          responseType: 'blob'
        })
        .subscribe(
          (docOrImage) => {
            const fileUrl = URL.createObjectURL(docOrImage);
            window.open(fileUrl, '_blank');
            this.cdRef.detectChanges();
          },
          (error: Error) => {
            this.messageService.error(
              'igo.geo.targetHtmlUrlUnauthorized',
              'igo.geo.targetHtmlUrlUnauthorizedTitle'
            );
          }
        );
    } else {
      let url = value;
      if (this.isEmbeddedLink(value)) {
        var div = document.createElement('div');
        div.innerHTML = value;
        url = div.children[0].getAttribute('href');
      }
      window.open(url, '_blank');
    }
  }

  getEmbeddedLinkText(value) {
    const regex = /(?:>).*?(?=<|$)/;
    let text = value.match(regex)[0] as string;
    text = text.replace(/>/g, '');
    return text;
  }

  filterFeatureProperties(feature) {
    const allowedFieldsAndAlias = feature.meta ? feature.meta.alias : undefined;
    this.featureTitle = feature.meta ? feature.meta.title : undefined; // will define the feature info title in the panel
    const properties = {};

    if (feature.properties && feature.properties.Route) {
      delete feature.properties.Route;
    }

    if (allowedFieldsAndAlias) {
      Object.keys(allowedFieldsAndAlias).forEach((field) => {
        properties[allowedFieldsAndAlias[field]] = feature.properties[field];
      });
      return properties;
    } else {
      if (
        this.state.connection &&
        feature.meta &&
        feature.meta.excludeAttribute
      ) {
        const excludeAttribute = feature.meta.excludeAttribute;
        excludeAttribute.forEach((attribute) => {
          delete feature.properties[attribute];
        });
      } else if (
        !this.state.connection &&
        feature.meta &&
        feature.meta.excludeAttributeOffline
      ) {
        const excludeAttributeOffline = feature.meta.excludeAttributeOffline;
        excludeAttributeOffline.forEach((attribute) => {
          delete feature.properties[attribute];
        });
      }
    }
    return feature.properties;
  }
}
