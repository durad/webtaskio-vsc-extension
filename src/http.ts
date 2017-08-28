'use strict';

import * as vscode from 'vscode';

import * as jwtDecode from 'jwt-decode';
import * as rp from 'request-promise';

import * as constants from './constants';
import { ShowErrorMessage, SilentExit } from './errors';
import { IWebtask } from './types';

export async function getWebtasksList(profile, selectedToken?): Promise<IWebtask[]> {
    try {
        let result: IWebtask[] = await rp({
            method: 'get',
            uri: `${profile.url}/api/webtask/${profile.container}`,
            json: true,
            headers: {
                Authorization: `Bearer ${profile.token}`
            }
        });

        let webtasks: IWebtask[] = [];
        let first = result.filter(wt => wt.token === selectedToken)[0];

        if (first) {
            webtasks.push(first);
        }

        let rest = result.filter(wt => wt.token !== selectedToken);
        for (let wt of rest) {
            webtasks.push(wt);
        }

        return webtasks;
    } catch (err) {
        throw new ShowErrorMessage(`Unable to fetch webtask list.`);
    }
}

export async function getWebtask(profile, token): Promise<any> {
    try {
        let webtask = await rp({
            method: 'get',
            uri: `${profile.url}/api/tokens/inspect`,
            json: true,
            qs: {
                token,
                decrypt: 1,
                fetch_code: 1,
                meta: 1
            },
            headers: {
                Authorization: `Bearer ${profile.token}`
            }
        });

        return webtask;
    } catch (err) {
        throw new ShowErrorMessage(`Could not fetch webtask.`);
    }
}

export async function requestVerificationCode(query): Promise<void> {
    try {
        await rp({
            method: 'get',
            uri: `https://webtask.it.auth0.com/api/run/auth0-webtask-cli`,
            json: true,
            qs: query,
            headers: {
                Authorization: `Bearer ${constants.VERIFIER_TOKEN}`
            }
        });
    } catch (err) {
        throw new ShowErrorMessage(`Unable to request verification code.`);
    }
}

export async function verifyCode(query): Promise<IWebtask> {
    try {
        let response = await rp({
            method: 'get',
            uri: `https://webtask.it.auth0.com/api/run/auth0-webtask-cli`,
            json: true,
            qs: query,
            headers: {
                Authorization: `Bearer ${constants.VERIFIER_TOKEN}`
            }
        });

        return jwtDecode(response.id_token).webtask;
    } catch (err) {
        throw new ShowErrorMessage('We were unable to verify your identity.');
    }
}

export async function createNewWebtask(profile, webtaskName, code): Promise<IWebtask> {
    try {
        let response = await rp({
            method: 'put',
            uri: `${profile.url}/api/webtask/${profile.container}/${webtaskName}`,
            json: true,
            headers: {
                Authorization: `Bearer ${profile.token}`
            },
            body: {
                code
            }
        });

        return response;
    } catch (err) {
        throw new ShowErrorMessage('Unable to create new webtask.');
    }
}

export async function updateWebtask(profile, webtaskContainer, webtaskName, code) {
    try {
        let response = await rp({
            method: 'put',
            uri: `${profile.url}/api/webtask/${webtaskContainer}/${webtaskName}`,
            json: true,
            headers: {
                Authorization: `Bearer ${profile.token}`
            },
            body: {
                code
            }
        });
    } catch (err) {
        throw new ShowErrorMessage('Unable to update webtask.');
    }
}
