'use strict';

import * as fs from 'fs';
import * as userHome from 'user-home';
import * as vscode from 'vscode';

import { ShowErrorMessage, SilentExit } from './errors';
import { IWebtask } from './types';

export function defaultProfileExists(): boolean {
    let vscodeWtConf = vscode.workspace.getConfiguration('webtask');
    if (!vscodeWtConf.configPath) {
        throw new ShowErrorMessage(`Could not read webtask.configPath configuration.`);
    }

    let configPath: string = vscodeWtConf.configPath.replace('$HOME', userHome);

    return fs.existsSync(configPath);
}

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
