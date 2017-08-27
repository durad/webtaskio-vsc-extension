'use strict';

import * as vscode from 'vscode';

import * as jwtDecode from 'jwt-decode';
import * as rp from 'request-promise';

import { Webtask } from './types';
import { ShowErrorMessage, SilentExit } from './errors';


let VERIFIER_TOKEN = 'eyJhbGciOiJIUzI1NiIsImtpZCI6IjIifQ.eyJqdGkiOiIyOTY5N2Y2MzM2ZTI0MWFjYTIxNjc1ZmE4ZWNmMjQ0MSIsImlhdCI6MTQzMzU0NzU2NCwiZHIiOjEsImNhIjpbXSwiZGQiOjAsInVybCI6Imh0dHBzOi8vY2RuLmF1dGgwLmNvbS93ZWJ0YXNrcy9zbXNfdmVyaWZpY2F0aW9uLmpzIiwidGVuIjoiYXV0aDAtd2VidGFzay1jbGkiLCJlY3R4IjoiK3BXR2MweFluUzV3V0laVlZOVjB5MmsyYitFY1MvbC9nTmwrc21ERkR6anFtdEp3RGl1a1JPMzcwVjZOUTJIZlc0am90YTQ0SXdDUE9iYUxneGhJc3pvWEVqdVAza1ZHWmUxZWF4T3BhdjFRelUzSTJRdlk2a1ZVVXM4YkhJMUtMcm52VjNEVjVRb1pJOEoxREErM2tuUDNXc3V4NnlydENPcXlrMUhpVGdFbS83Q1JSUFBmUzVuZTJEMTBKbnlaT2loMis1RTkzeVdidm5LM3F1aHF5VUl6QWlsQW1iSGNLRmpUMjB5OGF0MG03MXBzbm5teXN5K2I4MzJFN2F6aTBNbndTMUZ2UlRaWnNrUVdQdmlrWmpDRWE1bHhKUTBvanNHdklzMmVYRXhYNmxBUFBvTUVWd3k2T1pxYjA2Mzc2Njh4bHczQmRkUm9IUzF5UzZTVGNYcUY1YW42aDhkempxb29OWEF0aFFKeE5wQjN1c0VNcHdZOWxzSmxBNHpTLnhNaitWUGxkYUd5ZHhlcXRNYkJEK0E9PSJ9.cOcejs_Wj4XxpeR8WGxoSpQvec8NhfsScfirFPkATrg';


export async function getWebtasksList(profile, selectedToken?): Promise<Webtask[]> {
    try {
        let result: Webtask[] = await rp({
            method: 'get',
            uri: `${profile.url}/api/webtask/${profile.container}`,
            json: true,
            headers: {
                'Authorization': `Bearer ${profile.token}`
            },
        });

        let webtasks: Webtask[] = [];
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
                token: token,
                decrypt: 1,
                fetch_code: 1,
                meta: 1
            },
            headers: {
                'Authorization': `Bearer ${profile.token}`
            },
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
                'Authorization': `Bearer ${VERIFIER_TOKEN}`
            }
        });
    } catch (err) {
        throw new ShowErrorMessage(`Unable to request verification code.`);
    }
}

export async function verifyCode(query): Promise<Webtask> {
    try {
        let response = await rp({
            method: 'get',
            uri: `https://webtask.it.auth0.com/api/run/auth0-webtask-cli`,
            json: true,
            qs: query,
            headers: {
                'Authorization': `Bearer ${VERIFIER_TOKEN}`
            }
        });

        return jwtDecode(response.id_token).webtask;
    } catch (err) {
        throw new ShowErrorMessage('We were unable to verify your identity.');
    }
}

export async function createNewWebtask(profile, webtaskName, code): Promise<Webtask> {
    try {
        let response = await rp({
            method: 'put',
            uri: `${profile.url}/api/webtask/${profile.container}/${webtaskName}`,
            json: true,
            headers: {
                'Authorization': `Bearer ${profile.token}`
            },
            body: {
                code: code
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
                'Authorization': `Bearer ${profile.token}`
            },
            body: {
                code: code
            }
        });
    } catch (err) {
        throw new ShowErrorMessage('Unable to update webtask.');
    }
}
