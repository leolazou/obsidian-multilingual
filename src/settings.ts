import { App, PluginSettingTab, Setting } from 'obsidian';
import {default as MultilingualPlugin} from './main'

export interface MultilingualSettings {
	targetLanguages: string[];
    apiKey: string;
}

export const DEFAULT_SETTINGS: MultilingualSettings = {
    targetLanguages: ['fr', 'de'],
    apiKey: ""
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
		
		new Setting(containerEl)
            .setName('Target Languages')
            .setDesc('Comma-separated list of language codes (e.g., fr, de, cn)')
            .addText(text => text
                .setPlaceholder('fr, de, cn')
                .setValue(this.plugin.settings.targetLanguages.join(', '))
                .onChange(async (value) => {
                    this.plugin.settings.targetLanguages = value.split(',').map(lang => lang.trim());
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Google Translate API key')
            .setDesc('Create a Google Translate API key and paste it here. This is mandatory for the app to work. (The API key will be stored in the Obsidian config files in your Obsidian valut location.)')
            .addText(text => text
                .setPlaceholder('YOUR_API_KEY')
                .setValue(this.plugin.settings.targetLanguages.join(', '))
                .onChange(async (value) => {
                    this.plugin.settings.targetLanguages = value.split(',').map(lang => lang.trim());
                    await this.plugin.saveSettings();
                }));
	}
}