import { requestUrl } from "obsidian";
import { TranslationService, TranslationsResult, ErrorType } from "./translationService";
import { decodeHtmlEntities } from "./helpers";

const googleCloudTranslationURL = 'https://translation.googleapis.com/language/translate/v2'

export class GoogleTranslationService extends TranslationService {

    public async translate(text: string, targetLanguages: string[], sourceLanguage?: string): Promise<TranslationsResult> {
        let result: TranslationsResult = {};

        let params = new URLSearchParams({
            key: this.settings.apiKey,
            q: text,
            source: sourceLanguage || ''
        })

        try {
            for (let targetLanguage of targetLanguages) {
                params.set('target', targetLanguage);
                const response = await requestUrl({
                    url: `${googleCloudTranslationURL}?${params.toString()}`,
                    method: 'POST'
                })

                if (response.status !== 200) {
                    return {
                        errorType: ErrorType.OTHER_ERROR,
                        errorCode: response.status,
                        errorMessage: response.json.error!.message
                    }
                }

                const translations = response.json.data?.translations;
                if (!translations) {
                    return {errorType: ErrorType.OTHER_ERROR}
                }

                result.detectedLanguage ??= translations[0].detectedSourceLanguage;
                (result.translations ??= {})[targetLanguage] = translations.map((variants: any) => decodeHtmlEntities(variants.translatedText));
            }

            return result;

        } catch (error) {
            result.error = error;
            result.errorCode = error.errorCode;
            result.errorMessage = error.errorMessage;
            
            if (!navigator.onLine) {
                // no internet connection
                result.errorType = ErrorType.OFFLINE;
            } else {
                result.errorType = ErrorType.OTHER_ERROR;
            }

            // TODO implement more different errors
            return result;
        }
    }
}