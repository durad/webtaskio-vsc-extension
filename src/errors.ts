'use strict';

import * as vscode from 'vscode';

/**
 * When thrown this class will quit the running command and display provided message in a error message box.
 */
export class ShowErrorMessage extends Error {
    private showErrorMessage: boolean;

    constructor(message: string) {
        super(message);

        this.showErrorMessage = true;
    }
}

/**
 * When thrown this error will silently quit the running command.
 */
export class SilentExit extends Error {
}

/**
 * Handle all exceptions. This function terminates all commands wrappers.
 * @param err Thrown exception.
 */
export function handleError(err) {
    if (err instanceof ShowErrorMessage) { // show on the ui
        vscode.window.showErrorMessage(err.message);
    } else if (!(err instanceof SilentExit)) { // write to console unless it is a SilentExit
        console.error(err);
    }
}
