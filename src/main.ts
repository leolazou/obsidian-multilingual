import { Plugin, Editor, MarkdownView, TFile, Notice, Menu, FileView } from 'obsidian';
import { DEFAULT_SETTINGS, MultilingualSettings, MultilingualSettingTab } from './settings'
import { GoogleTranslationService } from './googleTranslationService';
import * as texts from  './texts.json';

export default class MultilingualPlugin extends Plugin {
	settings: MultilingualSettings;
	googleTranslationService: GoogleTranslationService;

	async onload() {
		await this.loadSettings();

		this.googleTranslationService = new GoogleTranslationService(this.settings)
		
		// Automatically translates title on title update if the setting is enabled.
		this.registerEvent(
			this.app.vault.on('rename', (file: TFile, oldPath: string) => {
				if (this.settings.autoTranslate) {
					this.translateTitle(file);
				}
			})
		)

		// Action in title right click menu to translate of the title.
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu: Menu, editor: Editor, view: MarkdownView) => {
				if (view.file) {
					let file = view.file
					menu.addItem((item) => {
						item
						.setTitle("Add title translation to aliases")
						.setIcon("languages") // icon from lucide.dev
						.onClick(() => {
							this.translateTitle(file);
						});
					});
				}
			})
		);

		// Editor command that triggers translation of the title of the current file.
		this.addCommand({
			id: 'multilingual-editor-translate-title',
			name: 'Translate page title into aliases',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				if (view.file) {
					this.translateTitle(view.file)
				} else {
					new Notice(texts.notices.NOT_A_FILE)
				}
			},
		});

		// Adds a settings tab
		this.addSettingTab(new MultilingualSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async translateTitle(file: TFile) {
        const title = file.basename;
		const translatedTitles = await this.googleTranslationService.translate(file.basename, this.settings.targetLanguages)
		if (translatedTitles) {
			this.addAliases(file, Object.values(translatedTitles))
		}
    }

	async addAliases(file: TFile, newAliases: string[]) {
		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			if (typeof(frontmatter) == 'object'){
				let aliases = frontmatter.aliases || []; // gets current aliases or creates the new list
				aliases = aliases.concat(newAliases); // adds new aliases
				aliases = [...new Set(aliases)]; // removes potential duplicates 

				frontmatter.aliases = aliases;
				new Notice(texts.notices.TRANSLATIONS_ADDED);
			}
		})
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
