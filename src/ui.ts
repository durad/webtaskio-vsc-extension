'use strict';

import * as vscode from 'vscode';

import { Webtask } from './types';
import { ShowErrorMessage, SilentExit } from './errors';


export async function askOverrideProfile(): Promise<boolean> {
    let response = await vscode.window.showQuickPick(
        ['Yes', 'No'],
        { placeHolder: 'You already have a profile. Would you like to override it?' }
    );

    if (typeof response === undefined) {
        throw new SilentExit();
    }

    return response === 'Yes';
}

export async function askEmailOrPhone(): Promise<string> {
    let response = await vscode.window.showInputBox({
        prompt: 'Please enter your e-mail or phone number, we will send you a verification code.',
        placeHolder: 'Email or phone'
    });

    if (typeof response === undefined) {
        throw new SilentExit();
    }

    return response;
}

export async function askForVerificationCode(emailOrPhone): Promise<string> {
    let verificationCode = await vscode.window.showInputBox({
        prompt: `Please enter the verification code we sent to ${emailOrPhone}`,
        placeHolder: '',
        ignoreFocusOut: true
    });

    if (typeof verificationCode === undefined) {
        throw new SilentExit();
    }

    return verificationCode;
}

export async function askWebtaskList(webtasks): Promise<any> {
    for (let wt of webtasks) {
        wt.label = wt.name;
    }

    let selectedItem = await vscode.window.showQuickPick(webtasks);

    if (selectedItem === undefined) {
        throw new SilentExit();
    }

    return selectedItem;
}

export async function askNewWebtaskName(): Promise<string> {
    let webtaskName = await vscode.window.showInputBox({
        prompt: 'Enter the name of the new webtask'
    });

    if (typeof webtaskName === undefined) {
        throw new SilentExit();
    }

    return webtaskName;
}

