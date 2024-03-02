import { App, PluginSettingTab, Setting, ToggleComponent } from 'obsidian';
import { default as MultilingualPlugin } from './main'
import { GoogleTranslationService } from './googleTranslationService';
import { DeepLService } from './deeplService';

type TranslationServiceName = 'Google Translate' | 'DeepL';

export const translationServicesMap: { [key in TranslationServiceName]: any } = {
    'Google Translate': GoogleTranslationService,
    'DeepL': DeepLService
}

export interface MultilingualSettings {
	targetLanguages: string[];
    autoTranslate: boolean;
    selectedTranslationService: TranslationServiceName;
    apiKeys: {[key in TranslationServiceName]: string};
}

export const DEFAULT_SETTINGS: MultilingualSettings = {
    targetLanguages: ['fr', 'de'],
    autoTranslate: false,
    selectedTranslationService: 'Google Translate',
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

    // Updates the api key field in the setting to reflect the chosen service
    private updateApiKeySetting(apiKeySetting: Setting) {
        apiKeySetting
            .clear()
            .setName(`${this.plugin.settings.selectedTranslationService} API key (mandatory)`)
            .setDesc(`Create a ${this.plugin.settings.selectedTranslationService} API key and paste it here. This is mandatory for the plugin to work. (The API key is stored in the Obsidian config files in your Obsidian valut location.)`)
            .addText(text => text
                .setPlaceholder(this.plugin.settings.apiKeys ? "*** *** *** ".concat(this.plugin.settings.apiKeys[this.plugin.settings.selectedTranslationService].slice(-4)) :'YOUR_API_KEY')
                .onChange(async (value) => {
                    this.plugin.settings.apiKeys[this.plugin.settings.selectedTranslationService] = value;
                    await this.plugin.saveSettings();
                }));
    }

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

        containerEl.createEl('h3', { 'text': 'General settings' })
		
		new Setting(containerEl)
            .setName('Target languages')
            .setDesc('Comma-separated list of language codes (e.g.: "fr, de")')
            .addText(text => text
                .setPlaceholder('fr, de, cn, ...')
                .setValue(this.plugin.settings.targetLanguages.join(', '))
                .onChange(async (value) => {
                    this.plugin.settings.targetLanguages = value.split(',').map(lang => lang.trim());
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Auto translate')
            .setDesc('Enable to automatically add translations of the note title when you create a new note or change the title of an existing one')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoTranslate)
                .onChange((value: boolean) => {
                    this.plugin.settings.autoTranslate = value;
                    this.plugin.saveSettings();
                }));

        containerEl.createEl('h3', { 'text': 'Translation service' });

        new Setting(containerEl)
            .setName('Translation service')
            .setDesc('Google Translate is more widely used and supports more languages, DeepL is great and easier to set up.')
            .addDropdown(dropdown => dropdown
                .addOption('Google Translate', 'Google Translate')
                .addOption('DeepL', 'DeepL')
                .setValue(this.plugin.settings.selectedTranslationService)
                .onChange((value: TranslationServiceName) => {
                    this.plugin.settings.selectedTranslationService = value;
                    this.plugin.loadTranslationService();  // changes the service instanciated in the main.ts
                    this.updateApiKeySetting(apiKeySetting);
                })
                )

        let apiKeySetting = new Setting(containerEl);
        this.updateApiKeySetting(apiKeySetting);
	}
}