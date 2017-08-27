'use strict';

import * as vscode from 'vscode';

import { ShowErrorMessage } from './errors';


export function isPhone(value) {
    return value && !!value.match(/^\+?[0-9]{1,15}$/);
};

export function isEmail(value) {
    return !!value.match(/[^@]+@[^@]+/i);
}

export function processEmailOrPhone(value: string): any {
    let query: any = {};

    if (isPhone(value)) {
        if (value.indexOf('+') !== 0) {
            value = '+1' + value; // default to US
        }

        query.phone = value;
    } else if (isEmail(value)) {
        query.email = value;
    } else {
        throw new ShowErrorMessage('You must specify a valid e-mail address '
            + 'or a phone number. The phone number must start with + followed '
            + 'by country code, area code, and local number.');
    }

    return query;
}
