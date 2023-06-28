import { FiltersSharedMethodsService } from './filterServices/filters-shared-methods.service';
import { FiltersAdditionalPropertiesService } from './filterServices/filters-additional-properties.service';
import { FeatureCollection } from 'geojson';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnInit, OnDestroy, Output, EventEmitter, ViewChild, Input } from '@angular/core';
import { SimpleFilter, TypeOptions, Option } from './simple-filters.interface';
import { ConfigService } from '@igo2/core';
import { map } from 'rxjs/operators';
import { FormBuilder, FormGroup, AbstractControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { Subscription } from 'rxjs';
import { FiltersOptionService } from './filterServices/filters-option-service.service';
import { ListEntitiesService } from '../list/listServices/list-entities-services.service';

@Component({
  selector: 'app-simple-filters',
  templateUrl: './simple-filters.component.html',
  styleUrls: ['./simple-filters.component.scss']
})
export class SimpleFiltersComponent implements OnInit, OnDestroy {
  @Input() isMobile: boolean;
  @Input() propertiesMap: Map<string, Array<Option>>;
  @Output() filterSelection: EventEmitter<object> = new EventEmitter();
  @Output() activeFiltersUpdate: EventEmitter<Map<string, Option[]>> = new EventEmitter();
  @ViewChild(MatAutocompleteTrigger) panelTrigger: MatAutocompleteTrigger;


	public terrAPIBaseURL: string = "https://geoegl.msp.gouv.qc.ca/apis/terrapi/"; // base URL of the terrAPI API
	public terrAPITypes: Array<string>; // an array of strings containing the types available from terrAPI
  public simpleFiltersConfig: Array<SimpleFilter>; // simpleFilters config input by the user in the config file
  public allTypesOptions: Array<TypeOptions> = []; // array that contains all the options for each filter
  public filteredTypesOptions: Array<TypeOptions> = []; // array that contains the filtered options for each filter

  public filtersFormGroup: FormGroup; // form group containing the controls (one control per filter)
  public previousFiltersFormGroupValue: object; // object representing the previous value held in each control
  public filtersFormGroupValueChange$$: Subscription; // subscription to form group value changes
  public activeFilters: Map<string, Option[]> = new Map();  //map that contains all active filter options by type
  public filtersShown: boolean = false; //default status of filters in mobile mode
  public entitiesAll: Array<Object>;  //entities
  public entitiesList: Array<Object>;   //entities list provided by the service
  public additionalProperties: Map<number, Map<string, string>> = new Map(); //map of all additional properties by entity id e.g. {80029: {municipalite: Trois-Rivières}, {mrc: ...}}
  public properties: Array<string>; //string value of all properties that exist in the entities (e.g. "id", "nom", etc.)
  // public propertiesMap: Map<string, Array<Option>> = new Map(); //string of all properties (keys) and all values associated with this property

  constructor(private listEntitiesService: ListEntitiesService, private filterMethods: FiltersSharedMethodsService, private additionalPropertiesService: FiltersAdditionalPropertiesService, private configService: ConfigService, private http: HttpClient, private formBuilder: FormBuilder, private filterOptionService: FiltersOptionService) {
    this.entitiesAll = this.configService.getConfig("temporaryEntitiesAll");
    this.entitiesList = this.entitiesAll;
  }

  // getter of the form group controls
  get controls(): {[key: string]: AbstractControl} {
    return this.filtersFormGroup.controls;
  }

  public async ngOnInit(): Promise<void> {
    // get the simpleFilters config input by the user in the config file
    this.simpleFiltersConfig = this.configService.getConfig('useEmbeddedVersion.simpleFilters');

    this.emptyActiveFilters();

    // create a form group used to hold various controls
    this.filtersFormGroup = this.formBuilder.group({});

		// get all the types from terrAPI
		await this.getTypesFromTerrAPI().then((terrAPITypes: Array<string>) => {
			this.terrAPITypes = terrAPITypes;
		});

    // for each filter input by the user...
    for (let filter of this.simpleFiltersConfig) {
      if (filter.type) {
        // console.log("TYPE ", filter.type)
        // ...get the options from terrAPI and push them in the array containing all the options and add a control in the form group
        // typeoptions from terrAPI will have the optional list of options and those not from terrapi (from entitiesAll) will need to get the optionsList prior to this function being called
        await this.getOptionsOfFilter(filter).then((typeOptions: TypeOptions) => {
          let temp: Array<Option> = [];
          if(typeOptions.options){
            let last: Option = undefined;
            // console.log("tytyty ", typeOptions)
            for(let element of typeOptions.options){
              // console.log("element ", element)
              // console.log("last ", last)
              if(!last || element.nom !== last.nom){
                // console.log("pushing")
                temp.push(element);
                last = element;
              }
            }
            typeOptions.options = temp;
          }
          this.allTypesOptions.push(typeOptions);
					this.filtersFormGroup.addControl(typeOptions.type, this.formBuilder.control(''));
        });
      }
    }
    // deep-copy the array containing all the options to the one that will contain the filtered options (same at the start)
    // console.log("BEFORE2: ", this.filteredTypesOptions);
    this.filteredTypesOptions = JSON.parse(JSON.stringify(this.allTypesOptions));
    // console.log("AFTER2: ", this.filteredTypesOptions);

    // set previous value of the form group (each control value is an empty string at the start)
    this.previousFiltersFormGroupValue = this.filtersFormGroup.value;

    // when the user types in a field, filter the options of the filter and emit the value of the filters
    this.filtersFormGroupValueChange$$ = this.filtersFormGroup.valueChanges.subscribe((spatialFiltersFormCurrentValue: object) => {
      // console.log("FILTERSFORMGROUPVALUECHANGE");
      this.filterOptions(spatialFiltersFormCurrentValue);
			this.filterSelection.emit(this.filtersFormGroup.value);
    });

    this.filterOptionService.onEvent().subscribe(event => {
      // Handle the emitted event
      // console.log('Event received:', event);
      // console.log("event type: ", typeof event)
      this.onSelection(event);
    });

    this.listEntitiesService.onEvent().subscribe(entitiesList => {
      // Handle the emitted event
      this.updateCount();
      this.entitiesList = entitiesList;
      console.log('entitieslist received:', entitiesList);
    });
  }

  public ngOnDestroy() {
    // unsubscribe from form group value change
    this.filtersFormGroupValueChange$$.unsubscribe();
  }

  /**
   * @description Used to display the name of a value in a field
   * @param value An object representing the current value of the control
   * @returns A string representing the value to display in the field
   */
  public displayName(value: Option): string {
    return value?.nom ? value.nom : '';
  }

  /**
   * @description Get all the options for a given filter
   * @param filter A SimpleFilter object representing the filter
   * @returns The options for the given filter in the TypeOptions format
   */
  private async getOptionsOfFilter(filter: SimpleFilter): Promise<TypeOptions> {
    // console.log("getOptionsOfFilter");
    let typeOptions: TypeOptions;

		// if type is included in terrAPI...
		// if (this.terrAPITypes.includes(filter.type)) {
    //   console.log("terrapi contains ", filter.type);
		// 	// ...get options from terrAPI
    //   if(this.propertiesMap.get(filter.type) === undefined){
    //     console.log("filter type", filter.type)
    //     await this.getOptionsFromTerrAPI(true, filter.type).then((featureCollection: FeatureCollection) => {
    //       let options: Array<Option> = [];
    //       featureCollection.features.forEach(feature => {
    //         // ...push type, code and name of each option
    //         console.log("feature ", feature)
    //         if(filter.type === "municipalites"){
    //           console.log("Municipality feature ", feature)
    //           for(let property of this.propertiesMap){
    //             console.log("property[1] ", property[1])
    //             console.log("feature.properties[nom] ", feature.properties["nom"]);
    //             for(let entry of property[1]){
    //               if(typeof entry.nom === "string" && entry.nom.includes(feature.properties["nom"])){
    //                 options.push({type: filter.type, code: feature.properties.code, nom: feature.properties.nom});
    //                 console.log("length ", options.length)
    //               }
    //             }
    //           }
    //         }
    //       });
    //       typeOptions = {type: filter.type, description: filter.description, options: options};
    //     });
    //   }
    // 	// when options (feature collection) are returned...
		// // if type is not included in terrAPI...
  	// } else
    if (this.propertiesMap.has(filter.type)){
    // console.log("terrapi does not contain ", filter.type);
    // Add the options from the entitiesAll, not from the terrAPI call
      let ops: Array<Option> = [];
      for(let property of this.propertiesMap.get(filter.type)){
        if(ops.filter( element => element.nom === property.nom && element.type === property.type).length === 0){
          let op: Option = {nom: property.nom, type: property.type}
          ops.push(op)
        }
      }
      typeOptions = {type: filter.type, description: filter.description, options: ops};
    }
    else if (this.terrAPITypes.includes(filter.type) && filter.type === "municipalites"){
      let options: Array<Option> = [];
      for(let entity of this.entitiesAll) {
        let coords = entity["properties"]["coordonnees"];
        await this.filterMethods.getMunicipalityFromTerrAPI(filter.type, coords).then((featureCollection: FeatureCollection) => {
          featureCollection.features.forEach(feature => {
          // ...push type, code and name of each option
          // console.log("feature ", feature);
          let mun = feature.properties.nom;
          if(typeof mun === "string"){
            let op: Option = {type: filter.type, code: feature.properties.code, nom: feature.properties.nom};
            // console.log("option ", op);
            let newTypeMap: Map<string, string> = new Map();
            newTypeMap.set(filter.type, mun)
            this.additionalProperties.set(entity["properties"]["id"], new Map(newTypeMap));
            // console.log("additionalproperties: ", this.additionalProperties);
            // if(!options.includes(op)){
              // console.log("adding option ", op);
            // the checks for duplicates is performed elsewhere so there is no need to re-check it here. it is assumed that there sould be no duplicate elements
            options.push(op);
              // console.log("optionsArray ", options)
            // }
          }
          });
        });
      }
      this.additionalPropertiesService.emitEvent(this.additionalProperties);
      typeOptions = {type: filter.type, description: filter.description, options: options};
      // console.log("entities do not contain ", filter.type);
    }

		return typeOptions;
	}

	/**
   * @description Get an array containg all the types from terrAPI
   * @returns An array of strings containing the types of terrAPI
   */
	private async getTypesFromTerrAPI(): Promise<Array<string>> {
		// construct the URL
		const url: string = this.terrAPIBaseURL + "types";

		let response: Array<string>;

		// make the call to terrAPI and return the the types
		await this.http.get<Array<string>>(url).pipe(map((terrAPITypes: Array<string>) => {
			response = terrAPITypes;
			return terrAPITypes;
		})).toPromise();

		return response;
	}
  /**
   * @description Get all or some options from a call to terrAPI
   * @param returnAll A boolean representing if the call should return all of the options or if the options should be filtered
   * @param sType A string representing the source 'type' parameter from terrAPI
   * @param sCode A string representing the source 'code' parameter from terrAPI
   * @param tType A string representing the target 'type' parameter from terrAPI
   * @returns A feature collection from terrAPI
   */
  private async getOptionsFromTerrAPI(returnAll: boolean, sType: string, sCode?: string, tType?: string): Promise<FeatureCollection> {
    // construct the URL
    const url: string = returnAll ? this.terrAPIBaseURL + sType : this.terrAPIBaseURL + `${sType}/${sCode}/${tType}`;

    // set a sorting parameter to sort features by name in alphabetical order
    const params: HttpParams = new HttpParams().set('sort', 'nom');
    let response: FeatureCollection;

    console.log("url ", url, {params});

    // make the call to terrAPI and return the feature collection (options)
    await this.http.get<FeatureCollection>(url, {params}).pipe(map((featureCollection: FeatureCollection) => {
      response = featureCollection;
      return featureCollection;
    })).toPromise();

    return response;
  }

  // private async getMunicipalityFromTerrAPI(locationType: string, coordinates: "string"): Promise<FeatureCollection> {
  //   const url: string = this.terrAPIBaseURL + "locate?type=" + locationType + "&loc=" + coordinates;

  //   let response: FeatureCollection;

  //   await this.http.get<FeatureCollection>(url).pipe(map((featureCollection: FeatureCollection) => {
  //     response = featureCollection;
  //     return featureCollection;
  //   })).toPromise();
  //   return response;
  // }

  /**
   * @description Get the label of a given field
   * @param controlName A string representing the name of a control
   * @returns A string representing the label of a filter
   */
  public getLabel(controlName: string): string {
    // find and return the correct description
    return this.simpleFiltersConfig.find((filter: SimpleFilter) => filter.type === controlName).description;;
  }

  /**
   * @description Find and get the auto-complete options of a given field
   * @param formControlName A string representing the name of a control
   * @returns An array representing the options
   */
  public getOptions(formControlName: string): Array<Option> {
    // console.log("BEFORE3: ", this.filteredTypesOptions);
    let filteredOptions: Array<Option> = this.filteredTypesOptions.find(typeOptions => typeOptions.type === formControlName)?.options;

    // console.log("filteredoptions ", filteredOptions);
    //Case where the options are not fetched from TerrAPI and need to be fetched from the entities
    if(filteredOptions === undefined && this.propertiesMap.has(formControlName)) {
      filteredOptions = this.propertiesMap.get(formControlName);
    }

    if(!Array.isArray(filteredOptions)){
      return filteredOptions;
    }
    else{
      let activeFilteredOptions: Array<Option> = this.activeFilters.get(formControlName);
      //runtime here could be improved if needed
      for(let element of filteredOptions) {
        for(let activeElement of activeFilteredOptions) {
          if(element.nom === activeElement.nom && element.type === activeElement.type){
            // console.log("TYPE ", element.type);
            // console.log("CODE ", element.code);
            element.selected = activeElement.selected;
          };
        }
      }
    }
    return filteredOptions;
  }

  /**
   * @description On selection of an option, filter options of other filters
   * @param event The event fired when selecting an option from auto-complete
   */
  public async onSelection(selectedOption: Option) {
    //return autocomplete form to prior state
    this.filtersFormGroup.reset();

    // extract selected option from event
    // console.log("onSelection received")
    // const selectedOption: Option = event.option.value;
    // console.log("selectedOption: ",selectedOption);

    //Every time we select an option we toggle its selected status
    selectedOption.selected = !selectedOption.selected;

    // If it is not already in the activeFilters map, add it. Otherwise, remove it from activeFilters
    // Manually checking if it includes the selectedOption fields match any in the activeFilters map - except for selected field
    let matchingOptions = this.activeFilters.get(selectedOption.type).filter(element =>
      element.code === selectedOption.code && element.nom === selectedOption.nom && element.type === selectedOption.type);
    if(matchingOptions.length === 0) {
      // console.log("adding element")
      this.activeFilters.get(selectedOption.type).push(selectedOption);
    }else {
      // console.log("removing element")
      //remove element from activeFilters
      let temp = this.activeFilters.get(selectedOption.type);
      temp = temp.filter(element =>
        element.code !== selectedOption.code || element.nom !== selectedOption.nom || element.type !== selectedOption.type);
      this.activeFilters.set(selectedOption.type, temp);
      this.activeFiltersUpdate.emit(this.activeFilters);
    }


    // // for every type of filter...
    // console.log("IMPORTANT POINT: ", this.filteredTypesOptions);
    // for (let typeOptions of this.filteredTypesOptions) {
    //   // console.log("selectedOption.type: ", selectedOption.type, " typeOptions.type: ", typeOptions.type, " typeoptions.options: ", typeOptions.type)
    //   if (selectedOption.type !== typeOptions.type && typeOptions.options) {
    //     console.log("INSIDE IF selectedOption.type: ", selectedOption.type, " typeOptions.type: ", typeOptions.type, " typeoptions.options: ", typeOptions.type)
    //     // extract types and code
    //     const sourceType: string = selectedOption.type;
    //     const sourceCode: string = selectedOption.code;
    //     const targetType: string = typeOptions.type;

    //     // get options from terrAPI
    //     await this.getOptionsFromTerrAPI(false, sourceType, sourceCode, targetType).then((featureCollection: FeatureCollection) => {
		// 			let options: Array<Option> = [];

    //       // ...push new options in arrays and replace old options
    //       featureCollection.features.forEach(feature => {
    //         let element = {type: targetType, code: feature.properties.code, nom: feature.properties.nom};
    //         console.log("element: ", element);
    //         options.push(element);
    //       });

    //       console.log("options returned: ", options)
    //       typeOptions.options = options;
		// 		});
    //   }
    // }
    // console.log("BEFORE1: ", this.filteredTypesOptions);
    // this.allTypesOptions = JSON.parse(JSON.stringify(this.filteredTypesOptions));
    // console.log("AFTER1: ", this.filteredTypesOptions);

    // console.log("allTypesOptions: ", this.allTypesOptions);
  }

  /**
   * @description Filter options as the user types characters in a field
   * @param currentFormGroupValue An object representing the current value of the form (and its controls)
   */
  private filterOptions(currentFormGroupValue: object) {
    // for every control in the from group...
    for (let control in currentFormGroupValue) {
      const currentControlValue: string = currentFormGroupValue[control];
      const previousControlValue: string = this.previousFiltersFormGroupValue[control];
      // ...if the current value of the control is not the same as the previous value of the control...
      if (currentControlValue !== previousControlValue && typeof currentControlValue === 'string') {
        // ...filter the options and make the previous form group value the current form group value
        const options: Array<Option> = this.allTypesOptions.find((typeOptions: TypeOptions) =>
          typeOptions.type === control
        ).options;
				if (options) {
					const filteredOptions: Array<Option> = options.filter((option: Option) =>
          	option.nom.toLowerCase().includes(currentControlValue.toLowerCase())
					);
          console.log("BEFORE4: ", this.filteredTypesOptions);
        	this.filteredTypesOptions.find((typeOptions: TypeOptions) => typeOptions.type === control).options = filteredOptions;
          console.log("AFTER5: ", this.filteredTypesOptions);
				}
      }
    }
    this.previousFiltersFormGroupValue = currentFormGroupValue;
  }

  /**
   * @description Check if (a) value(s) is present in (a) field(s) to determine if buttons should be disabled
   * @returns A boolean representing if a button should be disabled or not
   */
  public areButtonsDisabled(): boolean {
    const formGroupValue: object = this.filtersFormGroup.value;
    let disabled: boolean = true;

    for (let control in formGroupValue) {
      if (typeof formGroupValue[control] === 'object' && formGroupValue[control] !== null) {
        disabled = false;
        break;
      }
    }

    return disabled;
  }

  /**
   * @description Reset/empty every field and reset the options
   */
  public async onResetFilters() {
    // reset the controls
    this.filtersFormGroup.reset();

    //reset active filters
    this.emptyActiveFilters();

    // // reset all of the options for every filter
    // for (let filter of this.simpleFiltersConfig) {
    //   if (filter.type) {
    //     // ...get the options from terrAPI and replace them in the array containing all the options
    //     await this.getOptionsOfFilter(filter).then((typeOptions: TypeOptions) => {
    //       this.allTypesOptions.find((typeOptions: TypeOptions) => typeOptions.type === filter.type).options = typeOptions.options;
    //     });
    //   }
    // }

    // deep-copy the array containing all the options
    console.log("BEFORE5: ", this.filteredTypesOptions);
    this.filteredTypesOptions = JSON.parse(JSON.stringify(this.allTypesOptions));
    console.log("AFTER5: ", this.filteredTypesOptions);

    //remove the selected status from the rest of the filters
    // for(let type of this.activeFilters){
    //   console.log
    // }

  }

    /**
   * @description Close autocomplete panel when it is opened
   */
  closeOpenPanel(isPanelOpen: boolean, event: Event): void {
    if(isPanelOpen) {
      event.stopPropagation();
      document.getElementById("list-scroll").click();
      isPanelOpen ? this.panelTrigger.closePanel() : this.panelTrigger.openPanel();
    }
  }

    /**
   * @description Initialize/reset map so that it contains all required keys but with empty arrays
   */
  emptyActiveFilters() {
    for(let filter of this.simpleFiltersConfig) {
      this.activeFilters.set(filter.type, []);
    }
    this.activeFiltersUpdate.emit(this.activeFilters);
  }

    /**
   * @description returns the length of the
   */
  getSelectionCount(type: string): number {
    return this.activeFilters.get(type).length;
  }

  public updateCount() {
    console.log("updatecount entitiesList ", this.entitiesList);
    console.log("alltypesOptions before: ", this.filteredTypesOptions)
    for(let filter of this.filteredTypesOptions){
      console.log("AAAAAA", filter.type, "AAAAA");
      let type: string = filter.type;
      for(let option of filter.options){
        option.count = 0;
        for(let entity of this.entitiesList){
          // console.log("type ", type)
          console.log("entity['properties'][type] ", entity["properties"][type]);
          console.log("option.nom ", option.nom);
          if(entity["properties"][type] === option.nom){
            option.count++;
          }
        }
      }
    }
    console.log("alltypesOptions after: ", this.filteredTypesOptions)

  }

}
