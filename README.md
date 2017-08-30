# Webtask.io Connect

Integrates functionality of [webtask.io](https://webtask.io) into VS Code.

![Create and Update](images/create-and-update.gif)

## Features

Allows opening, creating and updating webtasks code directly from the VS Code environment. Option Run will open webtask's URL in the browser.

## Commands

* Init - Initializes Webtask environment. The user will be asked for credentials and default profile will be created.

* Open - Opens a webtask from the server in a new text editor.

* Create - Creates a default Hello World webtask on the server.

* Update - Updates a code of a selected webtask on the server.

* Run - Opens up a url associated with the currently edited webtask in the browser.

## Extension Settings

This extension contributes the following settings:

* `webtask.configPath`: path to the .webtask file. Defaults to $HOME/.webtask

### 1.0.8

Fixed minor issues.

### 1.0.0

Initial release of the extension.

### Source

[GitHub](https://github.com/durad/webtaskio-vsc-extension)

### License

[MIT](LICENSE)
