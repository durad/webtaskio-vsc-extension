'use strict';

import * as vscode from 'vscode';

export class ShowErrorMessage extends Error {
    private showErrorMessage: boolean;

    constructor(message: string) {
        super(message);

        this.showErrorMessage = true;
    }
}

export class SilentExit extends Error {
}

export function handleError(err) {
    if (err instanceof ShowErrorMessage) {
        vscode.window.showErrorMessage(err.message);
    } else if (!(err instanceof SilentExit)) {
        console.error(err);
    }
}
