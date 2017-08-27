'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as fs from 'fs';

import * as vscode from 'vscode';
import { Uri } from 'vscode';

import * as request from 'request';
import * as rp from 'request-promise';
import * as userHome from 'user-home';
import * as jwtDecode from 'jwt-decode';


let VERIFIER_TOKEN = 'eyJhbGciOiJIUzI1NiIsImtpZCI6IjIifQ.eyJqdGkiOiIyOTY5N2Y2MzM2ZTI0MWFjYTIxNjc1ZmE4ZWNmMjQ0MSIsImlhdCI6MTQzMzU0NzU2NCwiZHIiOjEsImNhIjpbXSwiZGQiOjAsInVybCI6Imh0dHBzOi8vY2RuLmF1dGgwLmNvbS93ZWJ0YXNrcy9zbXNfdmVyaWZpY2F0aW9uLmpzIiwidGVuIjoiYXV0aDAtd2VidGFzay1jbGkiLCJlY3R4IjoiK3BXR2MweFluUzV3V0laVlZOVjB5MmsyYitFY1MvbC9nTmwrc21ERkR6anFtdEp3RGl1a1JPMzcwVjZOUTJIZlc0am90YTQ0SXdDUE9iYUxneGhJc3pvWEVqdVAza1ZHWmUxZWF4T3BhdjFRelUzSTJRdlk2a1ZVVXM4YkhJMUtMcm52VjNEVjVRb1pJOEoxREErM2tuUDNXc3V4NnlydENPcXlrMUhpVGdFbS83Q1JSUFBmUzVuZTJEMTBKbnlaT2loMis1RTkzeVdidm5LM3F1aHF5VUl6QWlsQW1iSGNLRmpUMjB5OGF0MG03MXBzbm5teXN5K2I4MzJFN2F6aTBNbndTMUZ2UlRaWnNrUVdQdmlrWmpDRWE1bHhKUTBvanNHdklzMmVYRXhYNmxBUFBvTUVWd3k2T1pxYjA2Mzc2Njh4bHczQmRkUm9IUzF5UzZTVGNYcUY1YW42aDhkempxb29OWEF0aFFKeE5wQjN1c0VNcHdZOWxzSmxBNHpTLnhNaitWUGxkYUd5ZHhlcXRNYkJEK0E9PSJ9.cOcejs_Wj4XxpeR8WGxoSpQvec8NhfsScfirFPkATrg';
let editorMap: any = {};

class ShowErrorMessage extends Error {
    showErrorMessage: boolean;

    constructor(message: string) {
        super(message);

        this.showErrorMessage = true;
    }
}

function handleError(err) {
    if (err.showErrorMessage) {
        vscode.window.showErrorMessage(err.message);
    } else {
        console.error(err);
    }
}

function isPhone(value) {
    return value && !!value.match(/^\+?[0-9]{1,15}$/);
};

function isEmail(value) {
    return !!value.match(/[^@]+@[^@]+/i);
}

async function defaultProfileExists(): Promise<boolean> {
    let vscodeWtConf = vscode.workspace.getConfiguration('webtask');
    if (typeof vscodeWtConf.configPath === undefined) {
        throw new ShowErrorMessage(`Could not read webtask.configPath configuration.`);
    }

    let configPath: string = vscodeWtConf.configPath.replace('$HOME', userHome);

    return fs.existsSync(configPath);
}

async function tryGetDefaultProfile(): Promise<any> {
    let vscodeWtConf = vscode.workspace.getConfiguration('webtask');
    if (typeof vscodeWtConf.configPath === undefined) {
        throw new ShowErrorMessage(`Could not read webtask.configPath configuration.`);
    }

    let configPath: string = vscodeWtConf.configPath.replace('$HOME', userHome);
    let configContent: string;
    let config;

    if (!fs.existsSync(configPath)) {
        return null;
    }

    try {
        configContent = fs.readFileSync(configPath, 'utf8');
    } catch (err) {
        return null;
    }

    try {
        config = JSON.parse(configContent);
    } catch (err) {
        return null;
    }

    if (typeof config.default === undefined) {
        return null;
    }

    return config.default;
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

async function writeDefaultProfile(profile: any): Promise<any> {
    let vscodeWtConf = vscode.workspace.getConfiguration('webtask');
    if (typeof vscodeWtConf.configPath === undefined) {
        throw new ShowErrorMessage(`Could not read webtask.configPath configuration.`);
    }

    let configPath: string = vscodeWtConf.configPath.replace('$HOME', userHome);

    try {
        let profileStr = JSON.stringify(profile, null, 2);
        fs.writeFileSync(configPath, profileStr, 'utf8');
    } catch (err) {
        throw new ShowErrorMessage(`Could not write file ${configPath}`);
    }
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

export function activate(context: vscode.ExtensionContext) {

    context.subscriptions.push(vscode.commands.registerCommand('webtask.init', () => {
        (async () => {

            let existingProfile = await tryGetDefaultProfile();

            if (existingProfile) {
                let override = await vscode.window.showQuickPick(
                    ['Yes', 'No'],
                    { placeHolder: 'You already have a profile. Would you like to override it?' }
                );

                if (override !== 'Yes') {
                    return;
                }
            }

            let emailOrPhone = await vscode.window.showInputBox({
                prompt: 'Please enter your e-mail or phone number, we will send you a verification code.',
                placeHolder: 'Email or phone',
                ignoreFocusOut: true
            });

            if (typeof emailOrPhone === undefined) {
                return;
            }

            let type: string;

            if (isPhone(emailOrPhone)) {
                if (emailOrPhone.indexOf('+') !== 0) {
                    emailOrPhone = '+1' + emailOrPhone; // default to US
                }

                type = 'phone';
            } else if (isEmail(emailOrPhone)) {
                type = 'email';
            } else {
                vscode.window.showErrorMessage('You must specify a valid e-mail address '
                    + 'or a phone number. The phone number must start with + followed '
                    + 'by country code, area code, and local number.');

                return;
            }

            let query = {};
            query[type] = emailOrPhone;

            await rp({
                method: 'get',
                uri: `https://webtask.it.auth0.com/api/run/auth0-webtask-cli`,
                qs: query,
                headers: {
                    'content-type': 'application/json',
                    'Authorization': `Bearer ${VERIFIER_TOKEN}`
                }
            });

            let verificationCode = await vscode.window.showInputBox({
                prompt: `Please enter the verification code we sent to ${emailOrPhone}`,
                placeHolder: '',
                ignoreFocusOut: true
            });

            if (typeof verificationCode === undefined) {
                return;
            }

            let webtask;

            try {
                let response = await rp({
                    method: 'get',
                    uri: `https://webtask.it.auth0.com/api/run/auth0-webtask-cli`,
                    json: true,
                    headers: {
                        'content-type': 'application/json',
                        'Authorization': `Bearer ${VERIFIER_TOKEN}`
                    },
                    qs: {
                        email: emailOrPhone,
                        verification_code: verificationCode
                    }
                });

               webtask = jwtDecode(response.id_token).webtask;
            } catch (err) {
                vscode.window.showErrorMessage('We were unable to verify your identity.');
                return;
            }

            let profile = {
                default: {
                    url: webtask.url,
                    token: webtask.token,
                    container: webtask.tenant
                }
            };

            await writeDefaultProfile(profile);

            await vscode.window.showInformationMessage('Successfully logged in to webtask.io.');

        })().catch(handleError);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('webtask.open', () => {
        (async () => {

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

        })().catch(handleError);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('webtask.update', () => {
        (async () => {

            let profile;
            let webtasks;

            await vscode.window.withProgress({ location: vscode.ProgressLocation.Window }, async progress => {
                progress.report({ message: 'Fetching webtasks' });

                let firstToken = null;
                for (let token in editorMap) {
                    if (vscode.window.activeTextEditor &&
                        vscode.window.activeTextEditor.document &&
                        editorMap[token] === vscode.window.activeTextEditor.document
                    ) {
                        firstToken = token;
                    }
                }

                profile = await getDefaultProfile();
                webtasks = await getWebtasksList(profile, firstToken);

                for (let wt of webtasks) {
                    wt.label = wt.name;
                }
            });

            let selectedItem: any = await vscode.window.showQuickPick(webtasks);
            if (selectedItem === undefined) return;

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

        })().catch(handleError);
    }));
}

export function deactivate() {
}
