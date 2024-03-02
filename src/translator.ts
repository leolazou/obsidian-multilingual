import { MultilingualSettings } from "./settings";

export enum ErrorType {
    OFFLINE = 'OFFLINE',
    AUTH_PROBLEM = 'AUTH_PROBLEM',
    FREE_LIMITS_REACHED = 'FREE_LIMITS_REACHED',
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
    OTHER_ERROR = 'OTHER_ERROR'
}

export interface TranslationsResult {
	errorType?: ErrorType;
    errorCode?: number;
    errorMessage?: string;
    error?: any

    translations?: { [key: string]: [string] };  // List of translations into every language
	detectedLanguage?: string;  // Detected language of the source text
}

export interface Translator {
    // translate a text into (one or) many languages, optionally specifying a source language
    translate(
        text: string,
        targetLanguages: string[],
        sourceLanguage?: string
    ): Promise<TranslationsResult>;
}

export abstract class Translator implements Translator {
    protected settings: MultilingualSettings;

    constructor(settings: MultilingualSettings) {
        this.settings = settings;
    }    
}