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
    translatorName: TranslatorName;
    apiKeys: {[key in TranslatorName]: string};
}

export const DEFAULT_SETTINGS: MultilingualSettings = {
    targetLanguages: ['fr', 'de'],
    autoTranslate: false,
    translatorName: 'Google Translate',
    apiKeys: {
        'Google Translate': '',
        'DeepL': ''
    }
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
            .setDesc(this.plugin.strings.settings.TARGET_LANGS_FIELD_DESC)
            .addText(text => text
                .setPlaceholder('fr, de, ...')
                .setValue(this.plugin.settings.targetLanguages.join(', '))
                .onChange(async (value) => {
                    this.plugin.settings.targetLanguages = value.split(',').map(lang => lang.trim());
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName(this.plugin.strings.settings.AUTO_TRANSLATE_TOGGLE_NAME)
            .setDesc(this.plugin.strings.settings.AUTO_TRANSLATE_TOGGLE_DESC)
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoTranslate)
                .onChange((value: boolean) => {
                    this.plugin.settings.autoTranslate = value;
                    this.plugin.saveSettings();
                }));

        containerEl.createEl('h3', { 'text': this.plugin.strings.settings.H3_TRANSLATOR });

        new Setting(containerEl)
            .setName(this.plugin.strings.settings.TRANSLATOR_SELECTOR_NAME)
            .setDesc(this.plugin.strings.settings.TRANSLATOR_SELECTOR_DESC)
            .addDropdown(dropdown => dropdown
                .addOption('Google Translate', 'Google Translate')
                .addOption('DeepL', 'DeepL')
                .setValue(this.plugin.settings.translatorName)
                .onChange((value: TranslatorName) => {
                    this.plugin.settings.translatorName = value;
                    this.plugin.loadTranslator();  // re-instanciates the translator in the main.ts to reflect the change
                    this.updateApiKeySetting(apiKeySetting);
                })
                )

        let apiKeySetting = new Setting(containerEl);
        this.updateApiKeySetting(apiKeySetting);
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
                    await this.plugin.saveSettings();
                }));
    }
}