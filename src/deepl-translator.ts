import { RequestUrlResponse, requestUrl } from "obsidian";
import { Translator, TranslationsResult, ErrorType } from "./translator";
import { decodeHtmlString } from "./helpers";

const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';

export class DeepLTranslator extends Translator {

    public async translate(text: string, targetLanguages: string[], sourceLanguage?: string): Promise<TranslationsResult> {
        let result: TranslationsResult = {};

        let params = new URLSearchParams({
            auth_key: this.settings.apiKeys['DeepL'],
            text: text,
            source_lang: sourceLanguage || ''
        })

        for (const targetLanguage of targetLanguages) {
            params.set('target_lang', targetLanguage);
            const response = await requestUrl({
                url: `${DEEPL_API_URL}?${params.toString()}`,
                method: 'POST',
                throw: false
            });

            if (response.status !== 200) {
                return {
                    errorType: this.classifyApiError(response),
                    error: response.text? response.json.message : undefined // sometimes the API seems to reply with just an error code and an empty unparsable message
                };
            }

            const translations = response.json.translations;
            if (!translations) {
                return {errorType: ErrorType.OTHER_ERROR};
            }

            result.detectedLanguage ??= translations[0].detected_source_language.toLowerCase();
            (result.translations ??= {})[targetLanguage] = translations.map((variant: any) => decodeHtmlString(variant.text));
        }

        return result;
    }

    private classifyApiError(response: RequestUrlResponse): ErrorType {
        if (response.status == 403) {
            return ErrorType.AUTH_PROBLEM;
        }
        else if (response.status == 400 && response.json.message?.contains('Value for \'target_lang\' not supported.')) {
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