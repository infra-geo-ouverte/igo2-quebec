import { Component, ElementRef, Renderer2, ViewChild, HostListener } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { userAgent } from '@igo2/utils';
import {
  LanguageService,
  ConfigService,
  MessageService,
  StorageService
} from '@igo2/core';
import { AuthOptions } from '@igo2/auth';
import { PwaService } from './services/pwa.service';
import { Workspace } from '@igo2/common';
import { MapState, WorkspaceState } from '@igo2/integration';
import { Feature } from '@igo2/geo';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { FeatureCollection } from 'geojson';
import { Option } from './pages/filters/simple-filters.interface';
import { FiltersAdditionalPropertiesService } from './pages/filters/filterServices/filters-additional-properties.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  @HostListener('window:resize', ['$event'])
	onResize() {
  		this.isMobile = window.innerWidth >= 768 ? false : true;
	}

  
	public terrAPIBaseURL: string = "https://geoegl.msp.gouv.qc.ca/apis/terrapi/"; // base URL of the terrAPI API
	public terrAPITypes: Array<string>; // an array of strings containing the types available from terrAPI
  public features: any = null; //object: {added: Feature[]}
  public clickedEntities: Feature[] = [];

  public showSimpleFilters: boolean = false;
  public showSimpleFeatureList: boolean = false;
  public useEmbeddedVersion: boolean = false;
  public isMobile: boolean = window.innerWidth >= 768 ? false : true; //boolean to determine screen width for layout
  public authConfig: AuthOptions;
  private themeClass = 'qcca-theme';
  public hasHeader: boolean = true;
  public hasFooter: boolean = true;
  private promptEvent: any;
  public hasMenu: boolean = false;
  public workspace = undefined;
  public additionalProperties: Map<string, Map<string,string>> = new Map<string, Map<string, string>>();
  public additionalTypes: Array<string>;
  public properties: Array<string>; //array of properties (the keys in the propertiesMap)
  public entitiesList: Array<Feature>; //list of entities that has been filtered
  public entitiesAll: Array<Feature>; //all entities
  public propertiesMap: Map<string, Array<Option>> = new Map(); //string of all properties (keys) and all values associated with this property
  public dataInitialized: boolean = false;
  public undefinedConfig = this.languageService.translate.instant('simpleFeatureList.undefined');

  @ViewChild('searchBar', { read: ElementRef, static: true })
  searchBar: ElementRef;

  constructor(
    private additionalPropertiesService: FiltersAdditionalPropertiesService,
    private http: HttpClient,
    protected languageService: LanguageService,
    private configService: ConfigService,
    private renderer: Renderer2,
    private titleService: Title,
    private metaService: Meta,
    private messageService: MessageService,
    private pwaService: PwaService,
    private storageService: StorageService,
    public workspaceState: WorkspaceState,
    private mapState: MapState,
  ) {
    this.readTitleConfig();
    this.readThemeConfig();
    this.readDescriptionConfig();

    this.detectOldBrowser();
    this.useEmbeddedVersion = this.configService.getConfig('useEmbeddedVersion') === undefined ? false : this.configService.getConfig('useEmbeddedVersion');
    this.showSimpleFilters = this.configService.getConfig('useEmbeddedVersion.simpleFilters') === undefined ? false : true;
    this.showSimpleFeatureList = this.configService.getConfig('useEmbeddedVersion.simpleFeatureList') === undefined ? false : true;
    this.hasHeader = this.configService.getConfig('header.hasHeader') !== undefined && !this.useEmbeddedVersion ?
      this.configService.getConfig('header.hasHeader') : false;

    this.hasFooter = this.configService.getConfig('hasFooter') === undefined ? false :
      this.configService.getConfig('hasFooter');

    this.hasMenu = this.configService.getConfig('hasMenu') === undefined ? false :
      this.configService.getConfig('hasMenu');

    this.setManifest();
    this.installPrompt();
    this.pwaService.checkForUpdates();
  }

  public async ngOnInit() {
    // get all the types from terrAPI
		await this.getTypesFromTerrAPI().then((terrAPITypes: Array<string>) => {
			this.terrAPITypes = terrAPITypes;
		});
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

  private readTitleConfig() {
    this.languageService.translate.get(this.configService.getConfig('title')).subscribe(title => {
      if (title) {
        this.titleService.setTitle(title);
        this.metaService.addTag({ name: 'title', content: title });
      }
    });
  }

  private setManifest() {
    const appConfig = this.configService.getConfig('app');
    if (appConfig?.install?.enabled) {
      const manifestPath = appConfig.install.manifestPath || 'manifest.webmanifest';
      document.querySelector('#igoManifestByConfig').setAttribute('href', manifestPath);
    }
  }

  private installPrompt() {
    const appConfig = this.configService.getConfig('app');
    if (appConfig?.install?.enabled && appConfig?.install?.promote) {
      if (userAgent.getOSName() !== 'iOS') {
        window.addEventListener('beforeinstallprompt', (event: any) => {
          event.preventDefault();
          this.promptEvent = event;
          window.addEventListener('click', () => {
            setTimeout(() => {
              this.promptEvent.prompt();
              this.promptEvent = undefined;
            }, 750);
          }, { once: true });
        }, { once: true });
      }
    }
  }

  private readThemeConfig() {
    const theme = this.configService.getConfig('theme') || this.themeClass;
    if (theme) {
      this.renderer.addClass(document.body, theme);
    }
  }

  private readDescriptionConfig() {
    const description = this.configService.getConfig('description');
    if (description) {
      this.metaService.addTag({ name: 'description', content: description });
    }
  }

  private detectOldBrowser() {
    const oldBrowser = userAgent.satisfies({
      ie: '<=11',
      chrome: '<64',
      firefox: '<60',
      safari: '<=11'
    });

    if (oldBrowser) {
      this.messageService.alert('oldBrowser.message', 'oldBrowser.title', {
        timeOut: 15000
      });
    }
  }

  async setSelectedWorkspace(workspace: Workspace) {
    if(this.dataInitialized) return;
    this.workspace = workspace;
    this.entitiesAll = this.workspace.entityStore.entities$.getValue() as Array<Feature>;
    this.entitiesList = this.workspace.entityStore.entities$.getValue() as Array<Feature>;

    this.properties = Object.keys(this.entitiesAll[0]["properties"]);
    for(let property of this.properties){
      let values: Array<Option> = [];
      for(let entry of this.entitiesAll){
        let option: Option = {nom: entry["properties"][property], type: property};
        !values.includes(entry["properties"][property]) ? values.push(option) : undefined;
      }
      this.propertiesMap.set(property, values);
    }

    await this.initializeAdditionalTypes().then((types: Array<string>) => {
      this.additionalTypes = types;
    });

    this.initializeAdditionalProperties();
    this.dataInitialized = true;
  }

  setClickedEntities(features: Feature[]) {
    this.clickedEntities = features;
  }

  onListSelection(event){
    this.features = event;
  }


  /**
   *
   * @returns additionalTypes array made up of valid TerrAPI types that are not contained in the entities properties
   */
  private async initializeAdditionalTypes() {
    //the 3 sections where we can define terrAPI types in the config file
    const listAttributesConfig = this.configService.getConfig('useEmbeddedVersion.simpleFeatureList.attributeOrder');
    const sortAttributesConfig = this.configService.getConfig('useEmbeddedVersion.simpleFeatureList.sortBy.attributes');
    const filtersAttributesConfig = this.configService.getConfig('useEmbeddedVersion.simpleFilters.filters');

    let terrAPIAttributes: Array<string> = [];
    if(sortAttributesConfig){
      for(let attribute of sortAttributesConfig) {
        let type = attribute["type"];
        if(type && !this.properties.includes(type) && !terrAPIAttributes.includes(type) && this.terrAPITypes.includes(type)) terrAPIAttributes.push(type);
      }
    }

    if(listAttributesConfig){
      for(let entry of listAttributesConfig){
        if(entry["personalizedFormatting"]){
          let attributeList: Array<string> = entry["personalizedFormatting"].match(/(?<=\[)(.*?)(?=\])/g);
          attributeList.forEach(type => {
            if(type && !this.properties.includes(type) && !terrAPIAttributes.includes(type) && this.terrAPITypes.includes(type)) terrAPIAttributes.push(type);
          })
        }else{
          let type = entry["attributeName"];
          if(type && !this.properties.includes(type) && !terrAPIAttributes.includes(type) && this.terrAPITypes.includes(type)) terrAPIAttributes.push(type);
        }
      }
    }

    if(filtersAttributesConfig){
      for(let filter of filtersAttributesConfig){
        let type = filter["type"];
        if(type && !this.properties.includes(type) && !terrAPIAttributes.includes(type) && this.terrAPITypes.includes(type)) terrAPIAttributes.push(type);
      }
    }

    for(let type of terrAPIAttributes){
      let geometryType;
      let url = "https://geoegl.msp.gouv.qc.ca/apis/terrapi/" + type + "?geometry=1&limit=1";

      await this.getGeometryType(url).then((type: Array<Feature>) => {
        geometryType = type["features"][0]["geometry"]["type"];
        return geometryType;
      });

      //remove it if it is neither a polygon or a multipolygon, since these types won't work
      if(geometryType.toLowerCase() !== "polygon" && geometryType.toLowerCase() !== "multipolygon"){
        terrAPIAttributes = terrAPIAttributes.filter(attribute => attribute !== type);
      }
    }

    return terrAPIAttributes;
  }

  /**
   * @description initializes additionalProperties by querying terrAPI based on the coordinates and the desired terrAPI type
   */
  private async initializeAdditionalProperties() {
    for(let entity of this.entitiesAll){
      await this.sleep(500);
      let coords: string = entity.geometry.coordinates.join(",");
      let typeMap = new Map<string, string>();
      for(let type of this.additionalTypes){
        await this.checkTerrAPI(type, coords).then(response => {
          if(response.features[0]){
            const name = response.features[0]["properties"]["nom"];
            typeMap.set(type, name);
          }else{
            typeMap.set(type, this.undefinedConfig);
          }
        });
      }
      this.additionalProperties.set(coords, typeMap);
    }
    this.additionalPropertiesService.emitEvent(this.additionalProperties);
  }

  /**
   * @description sleeps for a given amount of time so as not to sent too many terrAPI queries
   * @param ms time to sleep (in ms)
   */
  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * @param attribute the terrAPI type to search for
   * @param coordinates the coordinates to search for with terrAPI
   * @returns the response containing the geographic location of the desired attribute and coordinates
   */
  async checkTerrAPI(attribute: string, coordinates: string){
    let url: string = this.terrAPIBaseURL + "locate?type=" + attribute + "&loc=" + coordinates;

    return await this.http.get<FeatureCollection>(url).toPromise();
  }

  /**
   * @description sends a terrAPI requests and returns the response (used for obtaining the geometry type of a feature)
   * @param url the url that will be checked
   * @returns FeatureCollection containing geometryType
   */
  async getGeometryType(url: string){
    let response: Array<Feature>;

    await this.http.get<Array<Feature>>(url).pipe(map((features: Array<Feature>) => {
			response = features;
			return features;
		})).toPromise();

		return response;
  }

}
