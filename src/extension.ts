'use strict';

import * as vscode from 'vscode';
import { Uri, commands } from 'vscode';
import * as rp from 'request-promise';
import * as userHome from 'user-home';
import * as open from 'open';
import * as macOpen from 'mac-open';

import * as http from './http';
import * as ui from './ui';
import { Webtask } from './types';
import { ShowErrorMessage, SilentExit, handleError } from './errors';
import { isPhone, isEmail, processEmailOrPhone } from './util';
import * as config from './config';
import * as constants from './constants';


let editorMap: any = {};
let webtaskMap: any = {};

function getActiveEditorToken(): string {
    if (!vscode.window.activeTextEditor) {
        throw new ShowErrorMessage('There is no active editor.');
    }

    for (let token in editorMap) {
        if (editorMap[token] === vscode.window.activeTextEditor.document) {
            return token;
        }
    }

    throw new ShowErrorMessage('Could not find webtask associated with current editor.');
}

function registerAsyncCommand(context: vscode.ExtensionContext, command: string, callback: (...args: any[]) => Promise<any>, thisArg?: any) {
    context.subscriptions.push(vscode.commands.registerCommand(command, () => {
        callback().catch(handleError);
    }),
    thisArg);
}

export function activate(context: vscode.ExtensionContext) {

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
            url: webtask.url,
            token: webtask.token,
            container: webtask.tenant
        };

        config.writeDefaultProfile(profile);

        vscode.window.setStatusBarMessage('Successfully logged in to webtask.io.', 5000);
    });

    registerAsyncCommand(context, 'webtask.open', async () => {
        let profile = config.getDefaultProfile();

        let webtasks = await http.getWebtasksList(profile);

        let selectedWebtask = await ui.askWebtaskList(webtasks);

        let webtask = await http.getWebtask(profile, selectedWebtask.token);

        let editor = await vscode.workspace.openTextDocument(vscode.Uri.parse(`untitled:${selectedWebtask.name}.js`));

        await vscode.window.showTextDocument(editor, vscode.ViewColumn.One, true);

        await vscode.window.activeTextEditor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(0, 0), webtask.code);
        });

        editorMap[selectedWebtask.token] = editor;
        webtaskMap[selectedWebtask.token] = webtask;
    });

    registerAsyncCommand(context, 'webtask.create', async () => {
        let profile = config.getDefaultProfile();

        let webtaskName = await ui.askNewWebtaskName();

        let webtask = await http.createNewWebtask(profile, webtaskName, constants.NEW_WEBTASK_CODE);

        let editor = await vscode.workspace.openTextDocument(vscode.Uri.parse(`untitled:${webtaskName}.js`));

        await vscode.window.showTextDocument(editor, vscode.ViewColumn.One, true);

        await vscode.window.activeTextEditor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(0, 0), constants.NEW_WEBTASK_CODE);
        });

        editorMap[webtask.token] = editor;
        webtaskMap[webtask.token] = webtask;

        vscode.window.setStatusBarMessage(`Webtask ${webtaskName} successfully created`, 5000);
    });

    registerAsyncCommand(context, 'webtask.update', async () => {
        let firstToken = getActiveEditorToken();

        let profile = config.getDefaultProfile();

        let webtasks = await http.getWebtasksList(profile, firstToken);

        let selectedWebtask = await ui.askWebtaskList(webtasks);

        let code = vscode.window.activeTextEditor.document.getText();
        await http.updateWebtask(profile, selectedWebtask.container, selectedWebtask.name, code);

        editorMap[selectedWebtask.name] = selectedWebtask;
        webtaskMap[selectedWebtask.name] = selectedWebtask;

        vscode.window.setStatusBarMessage(`Webtask ${selectedWebtask.name} successfully updated`, 5000);
    });

    registerAsyncCommand(context, 'webtask.run', async () => {
        let token = getActiveEditorToken();

        if (process.platform === 'darwin') {
            macOpen(webtaskMap[token].webtask_url);
        } else {
            open(webtaskMap[token].webtask_url);
        }
    });
}

export function deactivate() {
}
