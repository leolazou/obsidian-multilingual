A quick tour for anyone willing to review the plugin or contribute.

Spoiler: I'm not a highly experienced dev. This codebase is surely not a guide to best practices ^.^


### Structure
```
/src/
|- README.md    Your current location 🧭
|- main.ts      Start point, plugin initialisation, commands are added here, translation is checked and triggered from here.
|- translator.ts    A class to be extended by translators (defines methods & response structure) + additional stuff.
|- xxx-translator.ts    API calls to translation services are created and executed here.
|- settings.ts  Well, the plugin settings window.
|- l10n/        Localisation files.
|  |- elements.ts   Sort of helpers for localisation purposes.
|  |- [xx].json     Strings in various languages for UI elements. 'en' only for now, I plan to add more translations later.
|- helpers.ts   Helper functions. Helpful.
```