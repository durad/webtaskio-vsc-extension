'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as fs from 'fs';

import * as vscode from 'vscode';
import { Uri } from 'vscode';

import * as request from 'request';
import * as rp from 'request-promise';
let userHome = require('user-home');

let editorMap: any = {};

class ShowErrorMessage extends Error {
    showErrorMessage: boolean;

    constructor(message: string) {
        super(message);

        this.showErrorMessage = true;
    }
}

async function getDefaultProfile(): Promise<any> {
    let vscodeWtConf = vscode.workspace.getConfiguration('webtask');
    if (typeof vscodeWtConf.configPath === undefined) {
        throw new ShowErrorMessage(`Could not read webtask.configPath configuration.`);
    }

    let configPath: string = vscodeWtConf.configPath.replace('$HOME', userHome);
    let configContent: string;
    let config;

    if (!fs.existsSync(configPath)) {
        throw new ShowErrorMessage(`Could not find file: ${configPath}. Use command [webtask init] to login.`);
    }

    try {
        configContent = fs.readFileSync(configPath, 'utf8');
    } catch (err) {
        throw new ShowErrorMessage(`Could not read file: ${configPath}`);
    }

    try {
        config = JSON.parse(configContent);
    } catch (err) {
        throw new ShowErrorMessage(`Could not parse JSON file: ${configPath}`);
    }

    if (typeof config.default === undefined) {
        throw new ShowErrorMessage(`Could not find default profile. Use command [webtask init] to login.`);
    }

    return config.default;
}

async function getWebtasksList(profile, selectedToken?): Promise<any> {
    let body;

    try {
        body = await rp({
            method: 'get',
            uri: `${profile.url}/api/webtask/${profile.container}`,
            headers: {
                'content-type': 'application/json',
                'Authorization': `Bearer ${profile.token}`
            },
        });
    } catch (err) {
        throw new ShowErrorMessage(`Could not connect to webtask.io.`);
    }

    let webtasks = [];
    try {
        let result = JSON.parse(body);
        let first = result.filter(wt => wt.token === selectedToken)[0];

        if (first) {
            webtasks.push(first);
        }

        let rest = result.filter(wt => wt.token !== selectedToken);
        for (let wt of rest) {
            webtasks.push(wt);
        }
    } catch (err) {
        throw new ShowErrorMessage(`Could not parse reponse from webtask.io.`);
    }

    return webtasks;
}

async function getWebtask(profile, token): Promise<any> {
    let body;
    let webtask;

    let params = [
        'token=' + token,
        'decrypt=1',
        'fetch_code=1',
        'meta=1'
    ].join('&');

    try {
        body = await rp({
            method: 'get',
            uri: `${profile.url}/api/tokens/inspect?${params}`,
            headers: {
                'content-type': 'application/json',
                'Authorization': `Bearer ${profile.token}`
            },
        });
    } catch (err) {
        throw new ShowErrorMessage(`Could not connect to webtask.io.`);
    }

    try {
        webtask = JSON.parse(body);
    } catch (err) {
        throw new ShowErrorMessage(`Could not parse reponse from webtask.io.`);
    }

    return webtask;
}

function showWindowErrorMessage(err) {
    if (err.showErrorMessage) {
        vscode.window.showErrorMessage(err.message);
    } else {
        console.error(err);
    }
}

export function activate(context: vscode.ExtensionContext) {

    context.subscriptions.push(vscode.commands.registerCommand('extension.open', () => {
        (async () => {

            let myOutputChannel = vscode.window.createOutputChannel('MyChannelName');
            myOutputChannel.show();
            myOutputChannel.appendLine('Visual Studio Code is awesome!');

            let profile;
            let webtasks;

            await vscode.window.withProgress({ location: vscode.ProgressLocation.Window }, async progress => {
                progress.report({ message: 'Fetching webtasks' });

                profile = await getDefaultProfile();
                webtasks = await getWebtasksList(profile);
            });

            for (let wt of webtasks) {
                wt.label = wt.name;
            }

            let selectedItem: any = await vscode.window.showQuickPick(webtasks);
            if (selectedItem === undefined) return;

            await vscode.window.withProgress({ location: vscode.ProgressLocation.Window }, async progress => {
                let webtask;

                progress.report({ message: 'Opening webtask' });

                webtask = await getWebtask(profile, selectedItem.token);

                let editor = await vscode.workspace.openTextDocument({
                    language: 'javascript',
                    content: webtask.code
                });

                vscode.window.showTextDocument(editor, vscode.ViewColumn.One, true);

                editorMap[selectedItem.token] = editor;
            });

        })().catch(showWindowErrorMessage);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('extension.update', () => {
        (async () => {

            let profile;
            let webtasks;

            await vscode.window.withProgress({ location: vscode.ProgressLocation.Window }, async progress => {
                progress.report({ message: 'Fetching webtasks' });

                // let myOutputChannel = vscode.window.createOutputChannel('MyChannelName');
                // myOutputChannel.show();
                // myOutputChannel.appendLine('Visual Studio Code is awesome!');

                let firstToken = null;
                for (let token in editorMap) {
                    if (vscode.window.activeTextEditor &&
                        vscode.window.activeTextEditor.document &&
                        editorMap[token] === vscode.window.activeTextEditor.document
                    ) {
                        firstToken = token;
                    }
                }

                // try {
                    profile = await getDefaultProfile();
                    webtasks = await getWebtasksList(profile, firstToken);
                // } catch (err) {
                //     vscode.window.showErrorMessage(err.message);
                //     return;
                // }

                for (let wt of webtasks) {
                    wt.label = wt.name;
                }
            });

            let selectedItem: any = await vscode.window.showQuickPick(webtasks);
            if (selectedItem === undefined) return;
// console.log(selectedItem);

            await vscode.window.withProgress({ location: vscode.ProgressLocation.Window }, async progress => {
                progress.report({ message: 'Saving webtask' });

                let body = await rp({
                    method: 'put',
                    uri: `${profile.url}/api/webtask/${selectedItem.container}/${selectedItem.name}`,
                    headers: {
                        'content-type': 'application/json',
                        'Authorization': `Bearer ${profile.token}`
                    },
                    body: JSON.stringify({
                        code: vscode.window.activeTextEditor.document.getText()
                    })
                });

            });

        })().catch(showWindowErrorMessage);
    }));
}

export function deactivate() {
}