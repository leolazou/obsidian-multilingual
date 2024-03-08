import { RequestUrlResponse, requestUrl } from "obsidian";
import { Translator, TranslationsResult, ErrorType } from "./translator";
import { decodeHtmlEntities } from "./helpers";

const GOOGLE_CLOUD_TRANSLATION_URL = 'https://translation.googleapis.com/language/translate/v2'

export class GoogleTranslator extends Translator {

    public async translate(text: string, targetLanguages: string[], sourceLanguage?: string): Promise<TranslationsResult> {
        let result: TranslationsResult = {};

        let params = new URLSearchParams({
            key: this.settings.apiKeys['Google Translate'],
            q: text,
            source: sourceLanguage || ''
        })

        for (let targetLanguage of targetLanguages) {
            params.set('target', targetLanguage);
            const response = await requestUrl({
                throw: false,
                url: `${GOOGLE_CLOUD_TRANSLATION_URL}?${params.toString()}`,
                method: 'POST'
            })

            if (response.status !== 200) {
                return {
                    errorType: this.classifyApiError(response),
                    error: response.json.error
                }
            }

            const translations = response.json.data?.translations;
            if (!translations) {
                return {errorType: ErrorType.OTHER_ERROR}
            }

            result.detectedLanguage ??= translations[0].detectedSourceLanguage;
            (result.translations ??= {})[targetLanguage] = translations.map((variant: any) => decodeHtmlEntities(variant.translatedText));
        }

        return result;
    }

    private classifyApiError(response: RequestUrlResponse): ErrorType {
        if (response.status == 403) {
            return ErrorType.AUTH_PROBLEM;
        }
        else if (response.status == 400 && response.json.error.message?.contains('API key not valid')) {
            return ErrorType.AUTH_BAD_KEY;
        }
        else if (response.status == 400 && response.json.error.message?.contains('Invalid Value') && response.json.error.details[0]?.fieldViolations[0]?.field == 'target') {
            return ErrorType.INVALID_LANGUAGES;
        }
        else if ([500, 503].includes(response.status)) {
            return ErrorType.SERVICE_UNAVAILABLE;
        }
        else {
            return ErrorType.OTHER_ERROR;
        }
    }
}