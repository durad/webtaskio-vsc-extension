'use strict';

import * as macOpen from 'mac-open';
import * as open from 'open';
import * as rp from 'request-promise';
import * as userHome from 'user-home';
import * as vscode from 'vscode';
import { commands, Uri } from 'vscode';

import * as config from './config';
import * as constants from './constants';
import { handleError, ShowErrorMessage, SilentExit } from './errors';
import * as http from './http';
import { IWebtask } from './types';
import * as ui from './ui';
import { isEmail, isPhone, processEmailOrPhone } from './util';

/**
 * keeps a link between opened documents and webtasks.
 */
let documentMap: Map<vscode.TextDocument, IWebtask> = new Map<vscode.TextDocument, IWebtask>();

/**
 * Gets the webtask associated with the active TextEditor if any.
 */
function tryGetActiveWebtask(): IWebtask {
    if (!vscode.window.activeTextEditor) {
        return null;
    }

    return documentMap.get(vscode.window.activeTextEditor.document) || null;
}

/**
 * Gets the webtask associated with the active TextEditor if there is any or thorws ShowErrorMessage otherwise.
 */
function getActiveWebtask(): IWebtask {
    if (!vscode.window.activeTextEditor) {
        throw new ShowErrorMessage('There is no active editor.');
    }

    let webtask = documentMap.get(vscode.window.activeTextEditor.document);
    if (webtask) {
        return webtask;
    }

    throw new ShowErrorMessage('Could not find webtask associated with current editor.');
}

/**
 * Function takes async function, wraps it in Promise, calls register command and subscribes it to extension context.
 * @param context An extension context passed to activate function.
 * @param command A unique identifier for the command.
 * @param callback A command handler function.
 * @param thisArg The `this` context used when invoking the handler function.
 */
function registerAsyncCommand(
    context: vscode.ExtensionContext,
    command: string, callback: (...args: any[]) => Promise<any>,
    thisArg?: any
) {
    context.subscriptions.push(vscode.commands.registerCommand(command, () => {
        callback().catch(handleError);
    }),
    thisArg);
}

/**
 * An entry point of an extesion. Called by VSCode extension host.
 */
export function activate(context: vscode.ExtensionContext) {

    // Initializes Webtask environment.
    registerAsyncCommand(context, 'webtask.init', async () => {
        let existingProfile = config.tryGetDefaultProfile();

        if (existingProfile) {
            let override = await ui.askOverrideProfile();

            if (!override) {
                return;
            }
        }

        let emailOrPhone = await ui.askEmailOrPhone();

        let query = processEmailOrPhone(emailOrPhone);

        await http.requestVerificationCode(query);

        query.verification_code = await ui.askForVerificationCode(emailOrPhone);

        let webtask = await http.verifyCode(query);

        let profile = {
            container: webtask.tenant,
            token: webtask.token,
            url: webtask.url
        };

        config.writeDefaultProfile(profile);

        vscode.window.setStatusBarMessage('Successfully logged in to webtask.io.', 5000);
    });

    // Opens a webtask from the server in a new text editor.
    registerAsyncCommand(context, 'webtask.open', async () => {
        let profile = config.getDefaultProfile();

        let webtasks = await http.getWebtasksList(profile);

        let selectedWebtask = await ui.askWebtaskList(webtasks);

        let webtask = await http.getWebtask(profile, selectedWebtask.token);

        // if selected webtask is already opened, we'll just update editor's content
        let document = vscode.workspace.textDocuments
            .filter(d => documentMap.get(d) && documentMap.get(d).token === selectedWebtask.token)[0];

        // if it doesn't exist create a new one
        if (!document) {
            document = await vscode.workspace.openTextDocument(vscode.Uri.parse(`untitled:${selectedWebtask.name}.js`));
        }

        await vscode.window.showTextDocument(document, vscode.ViewColumn.One, true);

        await vscode.window.activeTextEditor.edit(editBuilder => {
            let lastLine = document.lineCount - 1;
            let lastChar = document.lineAt(lastLine).text.length;

            editBuilder.replace(new vscode.Range(0, 0, lastLine, lastChar), webtask.code);
        });

        documentMap.set(document, selectedWebtask);
    });

    // Creates a default Hello World webtask on the server.
    registerAsyncCommand(context, 'webtask.create', async () => {
        let profile = config.getDefaultProfile();

        let webtaskName = await ui.askNewWebtaskName();

        let webtask = await http.createNewWebtask(profile, webtaskName, constants.NEW_WEBTASK_CODE);

        let document = await vscode.workspace.openTextDocument(vscode.Uri.parse(`untitled:${webtaskName}.js`));

        await vscode.window.showTextDocument(document, vscode.ViewColumn.One, true);

        await vscode.window.activeTextEditor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(0, 0), constants.NEW_WEBTASK_CODE);
        });

        documentMap.set(document, webtask);

        vscode.window.setStatusBarMessage(`Webtask ${webtaskName} successfully created`, 5000);
    });

    // Updates a code of a selected webtask on the server.
    registerAsyncCommand(context, 'webtask.update', async () => {
        let activeWebtask = getActiveWebtask();

        let profile = config.getDefaultProfile();

        let webtasks = await http.getWebtasksList(profile, activeWebtask ? activeWebtask.token : null);

        let selectedWebtask = await ui.askWebtaskList(webtasks);

        let code = vscode.window.activeTextEditor.document.getText();
        await http.updateWebtask(profile, selectedWebtask.container, selectedWebtask.name, code);

        documentMap.set(vscode.window.activeTextEditor.document, selectedWebtask);

        vscode.window.setStatusBarMessage(`Webtask ${selectedWebtask.name} successfully updated`, 5000);
    });

    // Opens up a webtask's URL in the browser.
    registerAsyncCommand(context, 'webtask.run', async () => {
        let webtask = getActiveWebtask();

        if (process.platform === 'darwin') {
            macOpen(webtask.webtask_url); // use macOpen for Macs
        } else {
            open(webtask.webtask_url); // Windows and Linuxes
        }
    });
}

export function deactivate() {
}
