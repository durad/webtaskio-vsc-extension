'use strict';

import * as vscode from 'vscode';

import { ShowErrorMessage } from './errors';

/**
 * Tests if a provided value is a valid phone number.
 * @param value Value to be tested.
 */
export function isPhone(value) {
    return value && !!value.match(/^\+?[0-9]{1,15}$/);
}

/**
 * Tests if the provided value is a valid email address.
 * @param value Value to be tested.
 */
export function isEmail(value) {
    return !!value.match(/[^@]+@[^@]+/i);
}

/**
 * Validates provided value to be a valid email or phone and creates query string out of it.
 * @param value Value to be processed.
 */
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
