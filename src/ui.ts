'use strict';

import * as vscode from 'vscode';

import { ShowErrorMessage, SilentExit } from './errors';
import { IWebtask } from './types';

/**
 * Asks user to confirm overwritting of a profile.
 */
export async function askOverrideProfile(): Promise<boolean> {
    let response = await vscode.window.showQuickPick(
        ['Yes', 'No'],
        { placeHolder: 'You already have a profile. Would you like to override it?' }
    );

    if (!response) {
        throw new SilentExit();
    }

    return response === 'Yes';
}

/**
 * Asks user to provide email or phone number.
 */
export async function askEmailOrPhone(): Promise<string> {
    let response = await vscode.window.showInputBox({
        placeHolder: 'Email or phone',
        prompt: 'Please enter your e-mail or phone number, we will send you a verification code.'
    });

    if (!response) {
        throw new SilentExit();
    }

    return response;
}

/**
 * Asks user for a verification code sent to email or phone.
 * @param emailOrPhone 
 */
export async function askForVerificationCode(emailOrPhone): Promise<string> {
    let verificationCode = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: '',
        prompt: `Please enter the verification code we sent to ${emailOrPhone}`
    });

    if (!verificationCode) {
        throw new SilentExit();
    }

    return verificationCode;
}

/**
 * Asks user to select a webtsk from a list.
 * @param webtasks List of webtasks objects.
 */
export async function askWebtaskList(webtasks: IWebtask[]): Promise<IWebtask> {
    for (let wt of webtasks) {
        (wt as any).label = wt.name;
    }

    let selectedItem = await vscode.window.showQuickPick<any>(webtasks);

    if (selectedItem === undefined) {
        throw new SilentExit();
    }

    return selectedItem;
}

/**
 * Asks user to provide a name for a new webtask.
 */
export async function askNewWebtaskName(): Promise<string> {
    let webtaskName = await vscode.window.showInputBox({
        prompt: 'Enter the name of the new webtask'
    });

    if (!webtaskName) {
        throw new SilentExit();
    }

    return webtaskName;
}
