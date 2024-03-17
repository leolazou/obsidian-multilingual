<h1 align=center>Obsidian Multilingual</h1>
<p align=center>
    Simplifies <a href=https://obsidian.md>Obsidian</a>'s powerful linking for multilingual users.
    This plugin automatically translates notes' names into multiple languages and allows you to easily link your notes across all the languages you use.
</p>



## The Idea 🔮
Many users of Obsidian use more than one language in their everyday life, but their thoughts are all connected across languages. The goal is to simplify the amazing linking logic of Obsidian for multilingual users, by allowing to more easily link notes and ideas in the current note language. While Obsidian offers aliases to answer this need, writing them manually for every note you create is frustrating. Why bother, when a plugin can do it for you?


<br>
<p align="center">
	<img width=70% src="https://github.com/leolazou/obsidian-multilingual/assets/22347352/67acc2b2-5dfb-4502-ad28-9cf744b98a19" alt="Obsidian Multilingual demo">
</p>
<br>


## Features 🪄
- 👍 Translate notes' names into desired languages. Translations are added to the aliases, which allows you to link your notes in all of the languages you use.
- 👍 Automatic translation of the names when you create a new note or rename an existing one.
- 🛠️ You can specify a folder, regex and date format to be ignored from automatic translation. YYYY-MM-DD are never automatically translated.
- 💡 The plugin leverages Obsidian aliases, so that all links remain functional even if the plugin uninstalled.

**Limitations, as of now:**
- 🤷‍♂️ Does not remove old aliases when a note is renamed (only adds new translations).



## Usage ✍️
1. Install & enable Obsidian Multilingual directly from Obsidian: Settings > Community plugins > Browse
2. Go to the plugin settings in Settings > Multilingual
3. List the languages you use for writing in Obsidian
4. create an API key for the translation service of your choice and paste it in the specified field. How-to links below.
5. Translate note name with the ribbon icon, command or riight-click menu.
6. Or just notice translations added automatically when you create and rename notes with "Auto translate" (ON by default).
7. (Advanced) You can specify a folder, regex and date format to be ignored from automatic translation. YYYY-MM-DD are never automatically translated.

(Creating an API key is mandatory, the plugin will not work without it.)



## Translation services 🙊🙉

You can choose between:
- [Google Cloud Translation](https://cloud.google.com/translate/docs/overview) (read: Google Translate)
- [DeepL](https://www.deepl.com/whydeepl)

Both are free to use for up to 500,000 characters per month, which is usually a lot higher than what you might require for using this plugin, even with a heavy use of Obsidian.
<details>
    <summary>Example</summary>
    If you name your notes in English and translate the note names into 2 more languages, you'll need to create approximately 10,000 notes per month to reach the free limit. Sounds like a challenge?
</details>

#### Quick Comparison

|                            | Google Cloud Translation                                                                                                                                                                                 | DeepL                                                                                                                                                                                                                                                                          |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| supported languages        | ~134 [(list)](https://cloud.google.com/translate/docs/languages)                                                                                                                                         | ~33 [(list)](https://www.deepl.com/docs-api/translate-text/translate-text)                                                                                                                                                                                                     |
| translation quality, imho  | slightly better                                                                                                                                                                                          | great                                                                                                                                                                                                                                                                          |
| free usage limit           | 500,000 characters / month                                                                                                                                                                               | 500,000 characters / month                                                                                                                                                                                                                                                     |
| credit card required ?     | yes.<br>(but you can set a $0 spending limit)                                                                                                                                                            | yes, only for ID verification<br>(to avoid free usage abuse)                                                                                                                                                                                                                   |
| ease of setup              | harder                                                                                                                                                                                                   | easy                                                                                                                                                                                                                                                                           |
| how to get an API key      | - [Docs](https://cloud.google.com/translate/docs)<br>- [A step-by-step guide by Gemini](https://g.co/gemini/share/d40e80c4a071)<br>- [A helpful video](https://youtu.be/WTt3UuiDAf4?si=eJRnRxSJq0P3bUTO) | - [Docs](https://support.deepl.com/hc/en-us/articles/360020695820-API-Key-for-DeepL-s-API)<br>- [A step-by-step guide by ChatGPT](https://chat.openai.com/share/4b51b21b-98e9-4915-ab73-28117e37960d)<br>- [A helpful video](https://youtu.be/WTt3UuiDAf4?si=eJRnRxSJq0P3bUTO) |



## Privacy & Legal 🕵️
The text (note names) the user will translate using this plugin - both manually and automatically when "Auto translate" is ON - will be sent to Google / DeepL for translation. Refer to:
- Google Cloud Translation:
[Data Usage FAQ](https://cloud.google.com/translate/data-usage)
& [Privacy Notice](https://cloud.google.com/terms/cloud-privacy-notice)
- DeepL: [Privacy Policy](https://www.deepl.com/en/privacy), notably section 12 about DeepL API Free.

Obsidian Multilingual is not officialy affiliated with any of the translation services mentioned above.



## Inspirations 💭
While no code was directly copy-pasted, I learnt a lot from the following projects to make it work:
- [Obsidian Translate](https://github.com/Fevol/obsidian-translate/tree/main)
- [Obsidian Link with alias](https://github.com/pvojtechovsky/obsidian-link-with-alias)



## Coffee ☕️

<a href='https://ko-fi.com/Y8Y1QGIXT' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi3.png?v=3' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>

...or [a couple of croissants 🥐](https://ko-fi.com/leolazou), but it's basically the same link.
