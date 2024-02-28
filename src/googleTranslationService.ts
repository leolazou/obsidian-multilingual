import { Notice, request } from "obsidian";
import { MultilingualSettings } from "./settings";
import { decodeHtmlEntities } from "./helpers";
import * as texts from "./texts.json";

const googleCloudTranslationURL = 'https://translation.googleapis.com/language/translate/v2'

export class GoogleTranslationService {
    private settings: MultilingualSettings;

    constructor (settings: MultilingualSettings) {
        this.settings = settings;
    }

    public async translate(text: string, targetLanguages: string[], sourceLanguage?: string): Promise<{ [key: string]: string }> {
        let url = `${googleCloudTranslationURL}?${[
            `key=${this.settings.apiKey}`,
            `q=${encodeURIComponent(text)}`
        ].join('&')}`

        if (sourceLanguage) {
            url = `${url}&source=${sourceLanguage}`
        }

        try {
            let multiLangTranslation:{ [key: string]: string } = {};

            for (let targetLanguage of targetLanguages) {
                url = `${url}&target=${targetLanguage}`;

                const response = await request({ url: url, method: 'POST' });
                const translations = JSON.parse(response).data?.translations;
                if (translations) {
                    if (translations[0].detectedSourceLanguage != targetLanguage) {
                        multiLangTranslation[targetLanguage] = decodeHtmlEntities(translations[0].translatedText)
                    } // else not adding to the list
                } else {
                    new Notice(texts.notices.GENERAL_TRANSLATION_ERROR)
                    throw new Error("Unexpected response format from Google Translate");
                }
            }

            return multiLangTranslation

        } catch (error) {
            if (!navigator.onLine) {  // no internet connection
                new Notice(texts.notices.OFFLINE)
            } else if (error.name === 'HTTPError' && error.message === 'Not authorized') {
                new Notice(texts.notices.AUTH_PROBLEM)
            } else {
                new Notice(texts.notices.GENERAL_TRANSLATION_ERROR)
            }
        }
        
        return {};
    }
}