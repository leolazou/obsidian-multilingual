import { Plugin, Editor, MarkdownView, TFile, Notice, Menu, moment } from 'obsidian';
import { MultilingualSettings, MultilingualSettingTab, DEFAULT_SETTINGS, translatorsMap } from './settings'
import { TranslationsResult, Translator } from './translator';
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

		// Adds a settings tab
		this.addSettingTab(new MultilingualSettingTab(this.app, this));

		// Automatically translates title when a note is created if the setting is enabled.
		this.app.workspace.onLayoutReady(() => {
			this.registerEvent (
				this.app.vault.on('create', (file: TFile) => {
					if (this.settings.autoTranslate) {
						this.autoTranslateTitle(file);
					}
				})
			)
		})

		// Automatically translates title on title update if the setting is enabled.
		this.registerEvent(
			this.app.vault.on('rename', (file: TFile, oldPath: string) => {
				if (this.settings.autoTranslate &&
					!oldPath.includes(file.name)  // not when file is simply moved to a new folder
				) {
					this.autoTranslateTitle(file);
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

		// Ribbon icon that triggers translation of the title of the current file.
		this.addRibbonIcon('languages', this.strings.menus.RIBBON_ICON_ACTION, (evt: MouseEvent) => {
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
            if (view && view.file) {
				this.translateTitle(view.file);
            } else {
				// a notice would be too annoying
			}
		});

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

	private isToBeAutoTranslated(title: string, path: string): boolean {
		const matchesPathToIgnore:boolean = !!this.settings.ignorePath && path.startsWith(this.settings.ignorePath);
		const isNumbersOnly:boolean = /^[0-9\.\,\'\+\-\_\&\@\%\~\$\(\) ]+$/.test(title);  // matches default date format YYYY-MM-DD among others
		const isUntitled:boolean = (new RegExp(`^${untitledIn(this.locale)}(?:\\s\\d+)?$`)).test(title);  // "Untitled [N]" in English, "Sans titre [N]" in French, ...
		const matchesDatesToIgnore:boolean = !!this.settings.ignoreDateFormat && moment(title, this.settings.ignoreDateFormat, true).isValid();
		const matchesRegexToIgnore:boolean = !!this.settings.ignoreRegex && (new RegExp(this.settings.ignoreRegex)).test(title);
		
		return !(matchesPathToIgnore || isNumbersOnly || isUntitled || matchesDatesToIgnore || matchesRegexToIgnore); 
	}

	async autoTranslateTitle(file: TFile) {
		if (
			this.isToBeAutoTranslated(file.basename, file.path) &&
			this.settings.setupComplete
		) {
			this.translateTitle(file);
		}
		// no auto-translation and unnecessary errors while the user hasn't yet set up the necessary (notably API keys).
		// maybe show a warning once in a while in case of incomplete setup tho?
	}

	async translateTitle(file: TFile) {
		let preCheckError = this.translator.preCheckErrors(file.basename, this.settings.targetLanguages);
		if (preCheckError) {
			new Notice(this.strings.notices.translation_errors[preCheckError]);
			return;
		}

		let translationsResult: TranslationsResult;
		try {
			translationsResult = await this.translator.translate(file.basename, this.settings.targetLanguages);
		} catch (error) {
			// API errors should be recognised and treated in the Translator, this is in case an un-handled error pops up
			new Notice(this.strings.notices.translation_errors.OTHER_ERROR);
			console.error("Unrecognised error during translation: " + error);
			return;
		}

		if (translationsResult.errorType) {
			new Notice(this.strings.notices.translation_errors[translationsResult.errorType]);
			if (translationsResult.error) {
				console.error("Error during translation: ", translationsResult.error);
			}
			return;
			// maybe later implement another logic where errors on some translations can keep other successful
		}

		let translationsToAdd = Object.entries(translationsResult.translations || {}) // Check if translations exists
			.filter(([langCode]) => langCode !== translationsResult.detectedLanguage)
			.map(([, variants]) => variants[0]); 
		
		this.addAliases(file, translationsToAdd, this.settings.addOriginalTitle);
    }

	async addAliases(file: TFile, aliases: string[], includeTitle: boolean = false) {
		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			if (typeof(frontmatter) == 'object'){
				if (includeTitle) {
					aliases.push(file.basename);
				} else {
					aliases.remove(file.basename);  // not to duplicate the title in the aliases, if any tranlsation(s) are identic to the title
				}
				const currentAliases = frontmatter.aliases || []; // gets current aliases or creates the new list
				const newAliases = [...new Set(currentAliases.concat(aliases))]; // adds new aliases and removes potential duplicates 

				if (newAliases.length > currentAliases.length) {
					frontmatter.aliases = newAliases;
					new Notice(`${aliases.join('\n')}\n\n${this.strings.notices.success.TRANSLATIONS_ADDED}`)
					// new Notice(`${this.strings.notices.success.TRANSLATIONS_ADDED}\n${aliases.join('\n')}`);
				} else {
					new Notice(this.strings.notices.success.No_TRANSLATIONS_ADDED);
					// TODO more granular messages depending on various cases
				}
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
			console.log(`Multilingual plugin isn't yet translated to ${this.locale} (funny, right?).  English selected by default as display language for the plugin. Unless the error is different: ` + error)
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
