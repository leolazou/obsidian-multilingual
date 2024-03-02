import { App, PluginSettingTab, Setting, ToggleComponent } from 'obsidian';
import { default as MultilingualPlugin } from './main'
import { TranslationService } from './translationService';
import { GoogleTranslationService } from './googleTranslationService';

type TranslationServiceName = 'Google Translate' | 'DeepL';

export const translationServicesMap: { [key in TranslationServiceName]: any } = {
    'Google Translate': GoogleTranslationService,
    'DeepL': GoogleTranslationService
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

        containerEl.createEl('h3', { 'text': 'API keys' })

        new Setting(containerEl)
            .setName('Google Translate API key (mandatory)')
            .setDesc('Create a Google Translate API key and paste it here. This is mandatory for the plugin to work. (The API key is stored in the Obsidian config files in your Obsidian valut location.)')
            .addText(text => text
                .setPlaceholder(this.plugin.settings.apiKeys ? "*** *** *** ".concat(this.plugin.settings.apiKeys['Google Translate'].slice(-4)) :'YOUR_API_KEY')
                .onChange(async (value) => {
                    this.plugin.settings.apiKeys['Google Translate'] = value;
                    await this.plugin.saveSettings();
                }));
	}
}