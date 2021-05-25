import {EOL} from 'os';

import {commands, ExtensionContext, window} from 'vscode';

type StringKind = 'text' | 'import' | 'importType' | 'declaration';

const describeString = (str: string): StringKind => {
    const colonCount = (str.match(/:/) || []).length;
    const questionMarkCount = (str.match(/\?/) || []).length;

    const equalPosition = str.indexOf('=');
    const isDeclaration = (equalPosition !== -1 && str.charAt(equalPosition + 1) !== '=') || colonCount > questionMarkCount;

    if (isDeclaration) {
        return 'declaration';
    }
    if (str.startsWith('import type')) {
        return 'importType';
    }
    if (str.startsWith('import')) {
        return 'import';
    }
    return 'text';
};

const sort = (a: string, b: string) => {
    const aKind = describeString(a.trim());
    if (aKind === 'text') {
        return 0;
    }

    let str1 = a.trim();
    let str2 = b.trim();
    if (aKind === 'declaration') {
        str1 = a.split('=')[0].trim();
        str2 = b.split('=')[0].trim();
    }
    if (aKind === 'import' || aKind === 'importType') {
        str1 = a.split('from')[0].trim();
        str2 = b.split('from')[0].trim();
    }

    if (str1.length === str2.length) {
        return str1 < str2 ? 1 : -1;
    }
    if (str1.length < str2.length) {
        return -1;
    }
    return 1;
};

const pyramid = (input: string): string => {
    const eolGroups = input.split(EOL + EOL);
    if (eolGroups.length > 1) {
        return eolGroups.map(pyramid).join(EOL + EOL);
    }
    const commentGroups = input.split('\\\\');
    if (commentGroups.length > 1) {
        return commentGroups.map(pyramid).join('\\\\');
    }

    const hasMultipleLines = input.includes(EOL);
    if (hasMultipleLines) {
        const lines = input.split(EOL).filter(s => !!s);
        const linesDescribed = lines.map(describeString);

        let shouldAlter = true;
        for (const kind of lines.map(describeString)) {
            if (kind !== linesDescribed[0]) {
                shouldAlter = false;
            }
        }

        return shouldAlter ? lines.sort(sort).join(EOL) + (input.charAt(input.length - 1) === EOL ? EOL : '') : input;
    }
    return input;
};

export const activate = (context: ExtensionContext) => {
    const disposable = commands.registerCommand('pyramidscheme.buildPyramid', () => {
        const editor = window.activeTextEditor;
        if (editor) {
            const {document, selection} = editor;
            const textSelected = document.getText(selection);

            editor.edit(builder => {
                builder.replace(selection, pyramid(textSelected));
            });
        }
    });

    context.subscriptions.push(disposable);
};

export const deactivate = () => {};
