import { requestUrl } from "obsidian";
import { Translator, TranslationsResult, ErrorType } from "./translator";
import { decodeHtmlEntities } from "./helpers";

const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';

export class DeepLTranslator extends Translator {

    public async translate(text: string, targetLanguages: string[], sourceLanguage?: string): Promise<TranslationsResult> {
        let result: TranslationsResult = {};

        let params = new URLSearchParams({
            auth_key: this.settings.apiKeys['DeepL'],
            text: text,
            source_lang: sourceLanguage || ''
        })

        try{
            for (const targetLanguage of targetLanguages) {
                params.set('target_lang', targetLanguage);
                const response = await requestUrl({
                    url: `${DEEPL_API_URL}?${params.toString()}`,
                    method: 'POST'
                });

                if (response.status !== 200) {
                    return {
                        errorType: ErrorType.OTHER_ERROR,
                        errorCode: response.status,
                        errorMessage: response.json.error!.message
                    };
                }

                const translations = response.json.translations;
                if (!translations) {
                    return {errorType: ErrorType.OTHER_ERROR};
                }

                result.detectedLanguage ??= translations[0].detected_source_language.toLowerCase();
                (result.translations ??= {})[targetLanguage] = translations.map((variant: any) => decodeHtmlEntities(variant.text));
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

            // TODO implement better errors
            return result;
        }
    }
}