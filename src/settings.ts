import { App, PluginSettingTab, Setting } from 'obsidian';
import { default as MultilingualPlugin } from './main'
import { GoogleTranslator } from './google-translator';
import { DeepLTranslator } from './deepl-translator';
import { strFormat } from './helpers';

type TranslatorName = 'Google Translate' | 'DeepL';

export const translatorsMap: { [key in TranslatorName]: any } = {
    'Google Translate': GoogleTranslator,
    'DeepL': DeepLTranslator
}

export interface MultilingualSettings {
	targetLanguages: string[];
    autoTranslate: boolean;
    ignoreDateFormat: string;
    ignoreRegex: string;
    ignorePath: string;
    addOriginalTitle: boolean;
    translatorName: TranslatorName;
    apiKeys: {[key in TranslatorName]: string};
    // not controlled by user:
    firstUse: boolean;
    setupComplete: boolean;
}

export const DEFAULT_SETTINGS: MultilingualSettings = {
    targetLanguages: [],
    autoTranslate: true,
    ignoreDateFormat: '',
    ignoreRegex: '',
    ignorePath: '',
    addOriginalTitle: false,
    translatorName: 'Google Translate',
    apiKeys: {
        'Google Translate': '',
        'DeepL': ''
    },
    // not controlled by user:
    firstUse: true,
    setupComplete: false
}

export class MultilingualSettingTab extends PluginSettingTab {
	plugin: MultilingualPlugin;

	constructor(app: App, plugin: MultilingualPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

        containerEl.createEl('h3', { 'text': this.plugin.strings.settings.H3_GENERAL})
		
		new Setting(containerEl)
            .setName(this.plugin.strings.settings.TARGET_LANGS_FIELD_NAME)
            .setDesc(createFragment((desc) => {
                desc.append(this.plugin.strings.settings.TARGET_LANGS_FIELD_DESC);
                desc.createEl('br');
                desc.append("Available languages: ");
                desc.createEl('a', { 'text': "Google Translate", 'href': "https://cloud.google.com/translate/docs/languages" });
                desc.append(" / ");
                desc.createEl('a', { 'text': "DeepL", 'href': "https://www.deepl.com/docs-api/translate-text/translate-text" });
            }))
            .addText(text => text
                .setPlaceholder('fr, it, ...')
                .setValue(this.plugin.settings.targetLanguages.join(', '))
                .onChange(async (value) => {
                    this.plugin.settings.targetLanguages = value ? value.split(',').map(lang => lang.trim()) : [];
                    this.checkSetupComplete();
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName(this.plugin.strings.settings.AUTO_TRANSLATE_TOGGLE_NAME)
            .setDesc(this.plugin.strings.settings.AUTO_TRANSLATE_TOGGLE_DESC)
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoTranslate)
                .onChange((value: boolean) => {
                    this.plugin.settings.autoTranslate = value;
                    ignoreDateFormatField.setDisabled(!value);
                    ignoreRegexField.setDisabled(!value);
                    ignorePathField.setDisabled(!value);
                    this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName(this.plugin.strings.settings.TRANSLATOR_SELECTOR_NAME)
            .setDesc(this.plugin.strings.settings.TRANSLATOR_SELECTOR_DESC)
            .addDropdown(dropdown => dropdown
                .addOption('Google Translate', 'Google Translate')
                .addOption('DeepL', 'DeepL')
                .setValue(this.plugin.settings.translatorName)
                .onChange(async (value: TranslatorName) => {
                    this.plugin.settings.translatorName = value;
                    this.plugin.loadTranslator();  // re-instanciates the translator in the main.ts to reflect the change
                    this.updateApiKeySetting(apiKeySetting);
                    await this.plugin.saveSettings();
                }));

        let apiKeySetting = new Setting(containerEl);
        this.updateApiKeySetting(apiKeySetting);

        containerEl.createEl('h3', { 'text': this.plugin.strings.settings.H3_ADVANCED})

        new Setting(containerEl)
            .setName(this.plugin.strings.settings.ADD_ORIGINAL_TITLE_NAME)
            .setDesc(this.plugin.strings.settings.ADD_ORIGINAL_TITLE_DESC)
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.addOriginalTitle)
                .onChange((value: boolean) => {
                    this.plugin.settings.addOriginalTitle = value;
                    this.plugin.saveSettings();
                }));

        const ignoreDateFormatField = new Setting(containerEl)
            .setName(this.plugin.strings.settings.IGNORE_DATE_FORMAT_FIELD_NAME)
            .setDesc(this.plugin.strings.settings.IGNORE_DATE_FORMAT_FIELD_DESC)
            .addText(text => text
                .setDisabled(!this.plugin.settings.autoTranslate)
                .setPlaceholder('YYYY-MM-DD')
                .setValue(this.plugin.settings.ignoreDateFormat)
                .onChange((value: string) => {
                    this.plugin.settings.ignoreDateFormat = value;
                    this.plugin.saveSettings();
                }));

        const ignoreRegexField = new Setting(containerEl)
            .setName(this.plugin.strings.settings.IGNORE_REGEX_FIELD_NAME)
            .setDesc(this.plugin.strings.settings.IGNORE_REGEX_FIELD_DESC)
            .addText(text => text
                .setDisabled(!this.plugin.settings.autoTranslate)
                .setPlaceholder('^_^regex...')
                .setValue(this.plugin.settings.ignoreRegex)
                .onChange((value: string) => {
                    this.plugin.settings.ignoreRegex = value;
                    this.plugin.saveSettings();
                }));

        const ignorePathField = new Setting(containerEl)
            .setName(this.plugin.strings.settings.IGNORE_PATH_FIELD_NAME)
            .setDesc(this.plugin.strings.settings.IGNORE_PATH_FIELD_DESC)
            .addText(text => text
                .setPlaceholder(this.plugin.strings.settings.IGNORE_PATH_FIELD_PLACEHOLDER)
                .setValue(this.plugin.settings.ignorePath)
                .onChange((value: string) => {
                    this.plugin.settings.ignorePath = value;
                    this.plugin.saveSettings();
                }));
	}

    // Updates the api key field in the setting to reflect the chosen translator
    private updateApiKeySetting(apiKeySetting: Setting) {
        apiKeySetting
            .clear()
            .setName(strFormat(this.plugin.strings.settings.API_KEY_FIELD_NAME, {translator: this.plugin.settings.translatorName}))
            .setDesc(strFormat(this.plugin.strings.settings.API_KEY_FIELD_DESC, {translator: this.plugin.settings.translatorName}))
            .addText(text => text
                .setPlaceholder(this.plugin.settings.apiKeys ? `*** *** *** ${this.plugin.settings.apiKeys[this.plugin.settings.translatorName].slice(-4)}` : 'YOUR_API_KEY')  // showing *** *** *** ABCD
                .onChange(async (value) => {
                    this.plugin.settings.apiKeys[this.plugin.settings.translatorName] = value;
                    this.checkSetupComplete();
                    await this.plugin.saveSettings();
                }));
    }

    private checkSetupComplete() {
        this.plugin.settings.setupComplete = 
            this.plugin.settings.targetLanguages.length > 0 &&
            this.plugin.settings.apiKeys[this.plugin.settings.translatorName].length > 0;
    }
}