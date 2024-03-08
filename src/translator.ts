import { MultilingualSettings } from "./settings";

export enum ErrorType {
    OFFLINE = 'OFFLINE',
    NO_LANGUAGES = 'NO_LANGUAGES',
    INVALID_LANGUAGES = 'INVALID_LANGUAGES',
    AUTH_NO_KEY = 'AUTH_NO_KEY',
    AUTH_BAD_KEY = 'AUTH_BAD_KEY',
    AUTH_PROBLEM = 'AUTH_PROBLEM',
    FREE_LIMITS_REACHED = 'FREE_LIMITS_REACHED',
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
    OTHER_ERROR = 'OTHER_ERROR'
}

export interface TranslationsResult {
	errorType?: ErrorType;
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

    preCheckErrors(
        text: string,
        targetLanguages: string[],
        sourceLanguage?: string
    ): ErrorType | undefined {
        if (!navigator.onLine) {
            return ErrorType.OFFLINE; // no internet connection
        } else if (!this.settings.apiKeys[this.settings.translatorName]) {
            return ErrorType.AUTH_NO_KEY;
        } else if (targetLanguages.length === 0) {
            return ErrorType.NO_LANGUAGES;
        }
        return undefined;
    }
}