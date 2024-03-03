import { Plugin, Editor, MarkdownView, TFile, Notice, Menu, moment } from 'obsidian';
import { MultilingualSettings, MultilingualSettingTab, DEFAULT_SETTINGS, translatorsMap } from './settings'
import { Translator } from './translator';
import { error, log } from 'console';
import { untitledIn } from './l10n/elements';
import * as defaultStrings from './l10n/en.json';

type StringsFormat = typeof defaultStrings;

export default class MultilingualPlugin extends Plugin {
	settings: MultilingualSettings;
	locale: string;
	strings: StringsFormat;
	translator: Translator;

	async onload() {
		await this.loadSettings();
		this.loadLocale();
		this.loadTranslator();

		// Automatically translates title when a note is created if the setting is enabled.
		this.app.workspace.onLayoutReady(() => {
			this.registerEvent (
				this.app.vault.on('create', (file: TFile) => {
					if (this.settings.autoTranslate && file.name && this.isToBeAutoTranslated(file.basename)) {
						this.translateTitle(file);
					}
				})
			)
		})

		// Automatically translates title on title update if the setting is enabled.
		this.registerEvent(
			this.app.vault.on('rename', (file: TFile, oldPath: string) => {
				if (this.settings.autoTranslate && this.isToBeAutoTranslated(file.basename)) {
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
						.setTitle(this.strings.menus.EDITOR_MENU_ACTION)
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
			name: this.strings.menus.COMMAND_ACTION,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				if (view.file) {
					this.translateTitle(view.file)
				} else {
					new Notice(this.strings.notices.errors.NOT_A_FILE)
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

	private isToBeAutoTranslated(title: string): boolean {
		if (moment(title, (this.settings.dateFormat || 'YYYY-MM-DD'), true).isValid()) {
			// if corresponds to the defined date format or YYYY-MM-DD by default, do not translate
			return false
		} else if ((new RegExp(`^${untitledIn(this.locale)}(?:\\s\\d+)?$`)).test(title)) {
			// if default titlename like "Untitled 3", respecting the locale, do not auto-translate
			return false;
		}
		return true;
	}

	async translateTitle(file: TFile) {
		const translationsResult = await this.translator.translate(file.basename, this.settings.targetLanguages);

		if (translationsResult.errorType) {
			new Notice(this.strings.notices.translation_errors[translationsResult.errorType]);
			if (translationsResult.error) {
				console.error("Error during translation :", error);
			}
			return;
			// maybe later implement another logic where errors on some translations can keep other successful
		}

		let translationsToAdd = Object.entries(translationsResult.translations || {}) // Check if translations exists
			.filter(([langCode]) => langCode !== translationsResult.detectedLanguage)
			.map(([, variants]) => variants[0]); 
		
		if (translationsToAdd.length > 0) {
			this.addAliases(file, translationsToAdd);
		} else {
			// no translations added
		}
    }

	async addAliases(file: TFile, newAliases: string[]) {
		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			if (typeof(frontmatter) == 'object'){
				let aliases = frontmatter.aliases || []; // gets current aliases or creates the new list
				aliases = aliases.concat(newAliases); // adds new aliases
				aliases = [...new Set(aliases)]; // removes potential duplicates 

				frontmatter.aliases = aliases;
				new Notice(this.strings.notices.success.TRANSLATIONS_ADDED);
			}
		})
	}

	// gets user's locale (Obsidian display language) to adapt some of the plugin's functionality to it
	private loadLocale() {
		this.locale = moment.locale();  // xx-xx format (ex: fr, zh-cn)
		
		this.strings = defaultStrings;
		try {
			this.strings = require(`./l10n/${this.locale}.json`);
		} catch (error) {
			// English kept by default if the display language not available for the plugin
			log(`Multilingual plugin isn't yet translated to ${this.locale} (funny, right?).  English selected by default as display language for the plugin. Unless the error is different: ` + error)
		}
	}

	// instanciates a Translator, based on the settings
	public loadTranslator() {
		this.translator = new translatorsMap[this.settings.translatorName](this.settings);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
