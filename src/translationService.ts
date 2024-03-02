import { Notice } from "obsidian";
import { MultilingualSettings } from "./settings";
import * as texts from './texts.json'

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

export abstract class TranslationService {
    protected settings: MultilingualSettings;

    constructor(settings: MultilingualSettings) {
        this.settings = settings;
    }
    
    // translate a text into (one or) many languages, optionally specifying a source language
    public abstract translate(
        text: string,
        targetLanguages: string[],
        sourceLanguage?: string
    ): Promise<TranslationsResult>;
}