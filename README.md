# ark-cms

[![Node.js version](https://img.shields.io/badge/Node.js->=12-brightgreen.svg)](https://nodejs.org)
[![License](https://img.shields.io/github/license/pb-it/ark-cms?label=license&style=yellow)](https://github.com/pb-it/ark-cms/blob/main/LICENSE)


## Description

Client-side rendered CMS application(JAM-stack) for usage with an API provided by a headless CMS backend.


## Requirements

This application is intended to be used with a 'modern' browser which at least support [ECMAScript 2016](https://262.ecma-international.org/7.0/).


## Current State

Current releases with major version 0.x.x are still a proof of concept of the system's architecture.

Although it provides basic [CRUD][1] operations, it doesn't have any sort of security mechanism.

See [Task List](#Task-List) or [Roadmap / Milestones](#Roadmap--Milestones) for futher progress.


## Usage / Getting Started


#### Requirements

**Supported operating systems:**

- Ubuntu LTS / Debian 9.x
- Windows 10/11
- Docker

> ℹ️ **_NOTE:_** Other operating systems may also work, but these are not tested nor officially supported at this time.


#### Installation

```bash
npm install
```


### Configuration

Server configuration is defined in `./config/server-config.js`.

By default the application uses port 4000.


#### Run

```bash
npm run start
```


Browse 'http://localhost:4000'


### Docker


#### Build

```bash
docker build . -t <image name>
```


#### Run

```bash
docker run -p 4000:4000 -d <image name>
```

or

```bash
# with interactive bash
docker run -p 4000:4000 -it <image name> /bin/bash
```

## Tests

**_PREREQUISITE:_** If not included or already installed setup driver(selenium-webdriver, chromedriver, geckodriver, iedriver) depending on your desired browser.

> ℹ️ **_NOTE:_** Using Firefox installation via Snap might cause troubles! There might also occur problems with executeScript/executeAsyncScript functions when using firefox. Hence I recommend to use Chrome for testing.

Create an profile for your browser (firefox: `about:profiles`, chrome: `chrome://version`).

Edit test configuration `./tests/config/test-config.js`

> ⚠️ **_WARNING:_** The test suite will clear the database on the configured API server! Ensure it does not contain any important data! 

```bash
# npm install --only=dev
# sudo npm install -g mocha
npm run test
```


## Documentation

Check our [wiki pages](https://github.com/pb-it/ark-cms/wiki) for examples and a more in-depth documentation.


## Changelog

See [changelog](./CHANGELOG.md)


## Task List

- [ ] Help system / Wiki
- [ ] Add user management/authentication (Sessions, ACLs, etc.)
- [ ] Language localization (L10N)
- [ ] Configureable dashboard
- [ ] Parse models from existing database
- [ ] Table view
- [ ] History / Content versioning


## Roadmap / Milestones


## Frequently Asked Questions


## Contributors


## Credits


### Images

 - Most icons are from [Font Awesome](https://fontawesome.com), [CC BY 4.0 License](https://fontawesome.com/license/free)
 - Loading icon is from [Ahm masum, CC BY-SA 4.0 <https://creativecommons.org/licenses/by-sa/4.0>, via Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Loading_icon.gif)
 - 'image_missing.png' is from [Papirus Development Team, Free for commercial use](https://icon-icons.com/icon/image-missing/92832)
 - 'video_icon.png' is from [Papirus Development Team, Free for commercial use](https://icon-icons.com/icon/playlist/92725)
 - 'audio_icon.png' is from [Papirus Development Team, Free for commercial use](https://icon-icons.com/icon/audio-generic/92734)
 - 'pdf_icon.png' is from [Papirus Development Team, Free for commercial use](https://icon-icons.com/icon/application-pdf/92726)


### Credits for Dependencies

 - [jQuery](https://jquery.com/)
 - [jQuery-Timepicker-Addon](https://github.com/trentrichardson/jQuery-Timepicker-Addon)
 - [showdown](https://github.com/showdownjs/showdown)
 - [highlight.js](https://github.com/highlightjs/highlight.js)
 - [jsdiff](https://github.com/kpdecker/jsdiff)

Check header of [index.html](./public/index.html) and [package.json](./package.json) for futher information


## Caveats

⚠️**WARNING**⚠️

This application is currently developed under the purpose of usage in private domains/networks. When you are going to use it in an public domain please consider local law / restrictions / constraints. For example this may include the duty of adding an imprint / legal notice / legal disclosure, etc. to the website.


## Disclaimer of Warranty & Limitation of Liability

See [MIT License](./LICENSE) for details.

---


**REMINDER**

* Use this software at your own risk
* Backup your data
* Verify and dry test your data before doing a production run

---


## License

[MIT License](./LICENSE)



[1]: https://de.wikipedia.org/wiki/CRUD