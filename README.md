# wing-cms

[![Node.js version](https://img.shields.io/badge/Node.js->=12-brightgreen.svg)](https://nodejs.org)
[![License](https://img.shields.io/github/license/pb-it/wing-cms?label=license&style=yellow)](https://github.com/pb-it/wing-cms/blob/main/LICENSE)


## Description
Client-side rendered CMS application(JAM-stack) for usage with an API provided by a headless CMS backend


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

Server configuration is defined in ./config/server.js.

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


## Documentation

Check our [wiki pages][wiki] for examples and a more in-depth documentation.


## Changelog

See [Changelog](./CHANGELOG.md)


## Roadmap


## Frequently Asked Questions


## Contributors


## Credits

Most icons are from [Font Awesome](https://fontawesome.com), [CC BY 4.0 License](https://fontawesome.com/license/free)

Loading icon is from [Ahm masum, CC BY-SA 4.0 <https://creativecommons.org/licenses/by-sa/4.0>, via Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Loading_icon.gif)

'image_missing.png' is from [Papirus Development Team, Free for commercial use](https://icon-icons.com/icon/image-missing/92832)

'video_file.png' is from [Icons8, Free for commercial use](https://icon-icons.com/icon/video-file/54125)

### Credits for Dependencies

[jQuery](https://jquery.com/)

[jQuery-Timepicker-Addon](https://github.com/trentrichardson/jQuery-Timepicker-Addon)

[showdown](https://github.com/showdownjs/showdown)

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