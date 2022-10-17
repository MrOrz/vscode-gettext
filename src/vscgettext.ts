/**
 * This module is the main entry point of vscode-gettext extension
 */

import * as vscode from 'vscode';

const msgidStartRgx = /^msgid\s+"(.*?)"\s*$/;
const msgstrStartRgx = /^msgstr\s+"(.*?)"\s*$/;
const msgctxtStartRgx = /^msgctxt\s+"(.*?)"\s*$/;
const continuationLineRgx = /^"(.*?)\s*"$/;

interface IMessage {
    msgid: string;
    msgidLine: number;
    msgstr: string;
    msgstrLine: number;
    msgctxt: string;
    msgctxtLine: number;
    firstline: number;
    lastline: number;
}

export function moveCursorTo(editor: vscode.TextEditor, lineno: number, colno = 0): vscode.Position {
    const position = new vscode.Position(lineno, colno);
    editor.selection = new vscode.Selection(position, position);
    return position;
}

function focusOnMessage(editor: vscode.TextEditor, message: IMessage) {
    const position = moveCursorTo(editor, message.msgstrLine, 8);
    editor.revealRange(
        new vscode.Range(position, position),
        vscode.TextEditorRevealType.InCenterIfOutsideViewport
    );
}

function* documentLines(document: vscode.TextDocument, startline = 1) {
    for (let lineno = startline; lineno < document.lineCount; lineno++) {
        yield document.lineAt(lineno);
    }
}

function* backwardDocumentLines(document: vscode.TextDocument, startline = document.lineCount - 1) {
    for (let lineno = startline; lineno >= 0; lineno--) {
        yield document.lineAt(lineno);
    }
}

function nextMessage(document: vscode.TextDocument, currentMessage: IMessage): IMessage {
    for (const line of documentLines(document, currentMessage.lastline + 1)) {
        if (line.text && !line.text.trim().startsWith('#')) {
            return currentMessageDefinition(document, line.lineNumber);
        }
    }
    return null;
}

function previousMessage(document: vscode.TextDocument, currentMessage: IMessage): IMessage {
    for (const line of backwardDocumentLines(document, currentMessage.firstline - 1)) {
        if (line.text && !line.text.trim().startsWith('#')) {
            return currentMessageDefinition(document, line.lineNumber);
        }
    }
    return null;
}

function currentMessageStart(document: vscode.TextDocument, currentLine: number): vscode.TextLine {
    let msgidLine = null;
    // go backwards to msgid definition
    for (const line of backwardDocumentLines(document, currentLine)) {
        if (msgidStartRgx.test(line.text)) {
            // we hit a msgid which is good, but we still need to go backwards
            // to check if we hit a msgctxt
            msgidLine = line;
            continue;
        }
        if (msgctxtStartRgx.test(line.text)) {
            // if we're on a msgctxt definition, this is the current message
            // definition start
            return line;
        }
        if (msgstrStartRgx.test(line.text) && msgidLine !== null) {
            // we hit a msgstr but we already hit a msgid definition, it means
            // that we've reached another message definition, return the line of
            // the msgid hit.
            return msgidLine;
        }
    }
    // if we've reached the beginning of the file, msgidLine won't have been set
    // and we'll return null in that case.
    return msgidLine;
}

export function currentMessageDefinition(document: vscode.TextDocument, currentline: number): IMessage {
    const firstline = currentMessageStart(document, currentline);
    if (firstline === null) {
        return null;
    }

    let currentProperty;
    const message: IMessage = {
        msgid: null,
        msgidLine: null,
        msgstr: null,
        msgstrLine: null,
        msgctxt: null,
        msgctxtLine: null,
        firstline: firstline.lineNumber,
        lastline: firstline.lineNumber,
    };

    if (msgctxtStartRgx.test(firstline.text)) {
        currentProperty = 'msgctxt';
        message.msgctxt = msgctxtStartRgx.exec(firstline.text)[1];
        message.msgctxtLine = firstline.lineNumber;
    } else {
        currentProperty = 'msgid';
        message.msgid = msgidStartRgx.exec(firstline.text)[1];
        message.msgidLine = firstline.lineNumber;
    }

    for (const line of documentLines(document, message.firstline + 1)) {
        if (msgctxtStartRgx.test(line.text)) {
            break;
        }
        if (msgidStartRgx.test(line.text)) {
            if (message.msgid !== null) {
                break;  // we are now on the next message, definition is over
            }
            message.msgid = msgidStartRgx.exec(line.text)[1];
            message.msgidLine = line.lineNumber;
            currentProperty = 'msgid';
        }
        if (msgstrStartRgx.test(line.text)) {
            message.msgstr = msgstrStartRgx.exec(line.text)[1];
            message.msgstrLine = line.lineNumber;
            currentProperty = 'msgstr';
        } else if (msgctxtStartRgx.test(line.text)) {
            message.msgctxt = msgctxtStartRgx.exec(line.text)[1];
            currentProperty = 'msgctxt';
        } else if (continuationLineRgx.test(line.text)) {
            message[currentProperty] += continuationLineRgx.exec(line.text)[1];
        }
        message.lastline++;
    }

    return message;
}

function nextUntranslatedMessage(document: vscode.TextDocument, lineno: number, backwards = false): IMessage {
    let message = currentMessageDefinition(document, lineno);
    const messageIterator = backwards ? previousMessage : nextMessage;
    while (message !== null) {
        message = messageIterator(document, message);
        if (message && !message.msgstr) {
            return message;
        }
    }
    return null;
}

function focusOnNextUntranslated(editor: vscode.TextEditor, backwards = false) {
    const position = editor.selection.active;
    const message = nextUntranslatedMessage(editor.document, position.line, backwards);
    if (message !== null) {
        focusOnMessage(editor, message);
    }
}

export function moveToNextUntranslatedMessage(editor: vscode.TextEditor) {
    focusOnNextUntranslated(editor);
}

export function moveToPreviousUntranslatedMessage(editor: vscode.TextEditor) {
    focusOnNextUntranslated(editor, true);
}

export function provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
    // Extract the line text and check if it is a comment with a source file reference
    const poLine = document.lineAt(position).text;
    if (poLine.startsWith('#: ') && poLine.split(' ').length > 1) {
        const sourceLocation = poLine.split(' ')[1].split(':');
        if (sourceLocation.length === 2) {
            // Get the source file path
            const sourceFile = sourceLocation[0];
            // Get the line number (vscode uses 0-based line numbers)
            const sourceLine: number = (+sourceLocation[1]) - 1;
            // Find files in the workspace matching the source file
            return vscode.workspace.findFiles(sourceFile).then(value => {
                if (!value) {
                    return;
                }

                // Set the source position to the 0th character of the line number
                const sourcePosition = new vscode.Position(sourceLine, 0);

                // Set the position for every matching file in the workspace
                const locations: vscode.Location[] = [];
                value.forEach(uri => {
                    locations.push(new vscode.Location(uri, sourcePosition));
                });
                return locations;
            });
        }
    }
}

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('vscgettext.moveToNextUntranslated', moveToNextUntranslatedMessage)
    );
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('vscgettext.moveToPreviousUntranslated', moveToPreviousUntranslatedMessage)
    );
    context.subscriptions.push(
        vscode.languages.registerDefinitionProvider('po', { provideDefinition })
    );
}

export function deactivate() {
    // deactivate extension
}
