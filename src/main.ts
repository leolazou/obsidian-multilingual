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

		// Automatically translates title when a note is created if the setting is enabled.
		this.app.workspace.onLayoutReady(() => {
			this.registerEvent (
				this.app.vault.on('create', (file: TFile) => {
					if (this.settings.autoTranslate &&
						file.name &&
						this.isToBeAutoTranslated(file.basename, file.path)
					) {
						this.translateTitle(file);
					}
				})
			)
		})

		// Automatically translates title on title update if the setting is enabled.
		this.registerEvent(
			this.app.vault.on('rename', (file: TFile, oldPath: string) => {
				if (this.settings.autoTranslate &&
					!oldPath.includes(file.name) &&  // not when file is simply moved to a new folder
					this.isToBeAutoTranslated(file.basename, file.path)
				) {
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

	private isToBeAutoTranslated(title: string, path: string): boolean {
		if (this.settings.ignorePath && path.startsWith(this.settings.ignorePath)) {
			// if path begins with defined ignore path, do not translate
			return false;
		} else if (/^[0-9\.\,\'\+\-\_\&\@\%\~\$\(\) ]+$/.test(title)) {
			// if only composed of numbers and special chars, do not translate
			return false;
		} else if ((new RegExp(`^${untitledIn(this.locale)}(?:\\s\\d+)?$`)).test(title)) {
			// if default titlename like "Untitled 3", respecting the locale, do not auto-translate
			return false;
		} else if (this.settings.dateFormat && moment(title, this.settings.dateFormat, true).isValid()) {
			// if corresponds to the defined date format, do not translate
			return false;
		} else if (this.settings.ignoreRegex && (new RegExp(this.settings.ignoreRegex)).test(title)) {
			// if matches a custom user Regex to be ignored, do not translate
			return false;
		}
		return true;
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
		
		this.addAliases(file, translationsToAdd);
    }

	async addAliases(file: TFile, aliases: string[]) {
		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			if (typeof(frontmatter) == 'object'){
				aliases.remove(file.basename);  // not to duplicate the title in the aliases, if the tranlsation(s) are identic to the title
				const currentAliases = frontmatter.aliases || []; // gets current aliases or creates the new list
				const newAliases = [...new Set(currentAliases.concat(aliases))]; // adds new aliases and removes potential duplicates 

				if (newAliases.length > currentAliases.length) {
					frontmatter.aliases = newAliases;
					new Notice(this.strings.notices.success.TRANSLATIONS_ADDED);
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
