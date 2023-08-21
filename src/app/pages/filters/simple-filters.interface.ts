export interface SimpleFilter {
	type: string; //the type that will be found from terrAPI or the entitiy properties
	description: string; //the description that will be displayed in the application
}

export interface TypeOptions {
	type: string;
	description: string;
	options?: Array<Option>;
}
export interface CustomEvent {
	option: Option;
	sortBy: string;
	pageSize: number;
}
export interface Option {
	type: string;
	nom: string;
	code?: string;
	selected?: boolean;
	count?: number;
}
