export interface SimpleFilter {
	type: string;
	description: string;
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
