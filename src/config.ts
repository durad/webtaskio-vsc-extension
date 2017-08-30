'use strict';

import * as fs from 'fs';
import * as userHome from 'user-home';
import * as vscode from 'vscode';

import { ShowErrorMessage, SilentExit } from './errors';
import { IWebtask } from './types';

/**
 * Returns true if a webtask config file exists.
 */
export function defaultProfileExists(): boolean {
    let vscodeWtConf = vscode.workspace.getConfiguration('webtask');
    if (!vscodeWtConf.configPath) {
        throw new ShowErrorMessage(`Could not read webtask.configPath configuration.`);
    }

    let configPath: string = vscodeWtConf.configPath.replace('$HOME', userHome);

    return fs.existsSync(configPath);
}

/**
 * Returns default profile if exists or null if it doesn't.
 */
export function tryGetDefaultProfile(): any {
    let vscodeWtConf = vscode.workspace.getConfiguration('webtask');
    if (!vscodeWtConf.configPath) {
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

    if (!typeof config.default) {
        return null;
    }

    return config.default;
}

/**
 * Returns default profile if exists or displays an error message if it doesn't.
 */
export function getDefaultProfile(): any {
    let vscodeWtConf = vscode.workspace.getConfiguration('webtask');
    if (!vscodeWtConf.configPath) {
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

    if (!config.default) {
        throw new ShowErrorMessage(`Could not find default profile. Use command [webtask init] to login.`);
    }

    return config.default;
}

/**
 * Overwrites config file with a new default profile.
 * @param profile Default profile to be written.
 */
export function writeDefaultProfile(profile: any): any {
    let vscodeWtConf = vscode.workspace.getConfiguration('webtask');
    if (!vscodeWtConf.configPath) {
        throw new ShowErrorMessage(`Could not read webtask.configPath configuration.`);
    }

    let configPath: string = vscodeWtConf.configPath.replace('$HOME', userHome);

    try {
        let config = { default: profile };
        let condifStr = JSON.stringify(config, null, 2);
        fs.writeFileSync(configPath, condifStr, 'utf8');
    } catch (err) {
        throw new ShowErrorMessage(`Could not write file ${configPath}`);
    }
}
