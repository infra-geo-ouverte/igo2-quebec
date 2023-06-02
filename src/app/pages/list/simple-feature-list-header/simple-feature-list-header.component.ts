import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Feature } from 'geojson';

@Component({
  selector: 'igo-simple-feature-list-header',
  templateUrl: './simple-feature-list-header.component.html',
  styleUrls: ['./simple-feature-list-header.component.scss']
})
export class SimpleFeatureListHeaderComponent implements OnInit, OnChanges {
  @Input() entitiesList: Array<Feature>; // an array containing all the entities in the store
  @Input() elementsLowerBound: number; // the lowest index (+ 1) of an element in the current page
  @Input() elementsUpperBound: number; // the highest index (+ 1) of an element in the current page

  public entitiesLength: number;

  constructor() {}

  ngOnInit() {
    // get the total number of entities
    this.entitiesLength = this.entitiesList.length;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.entitiesList) {
      if (!changes.entitiesList.firstChange) {
        this.entitiesLength = changes.entitiesList.currentValue.length;
      }
    }
  }
}
