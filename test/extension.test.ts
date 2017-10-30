import {assert} from 'chai';
import * as path from 'path';

import * as vscode from "vscode";
import * as vscgettext from "../src/vscgettext";


function inputpath(basename: string): string {
    return path.join(__dirname, '..', '..', 'test', 'inputfiles', basename);
}


function assertCursorAt(editor: vscode.TextEditor, lineno: number, colno: number) {
    const selection = editor.selection.active;
    const actualPos = {lineno: selection.line, colno: selection.character};
    assert.deepEqual(actualPos, {lineno, colno});
}


function openFile(path): Thenable<vscode.TextEditor> {
    return vscode.workspace.openTextDocument(path).then(document => {
        return vscode.window.showTextDocument(document);
    });
}

suite("vscode-gettext tests", () => {
    test('move to helper', done => {
        openFile(inputpath('messages.po')).then(editor => {
            vscgettext.moveCursorTo(editor, 10, 0);
            assertCursorAt(editor, 10, 0);
        }).then(done, done);
    });

    test('message definition parsing', done => {
        openFile(inputpath('messages.po')).then(editor => {
            const message = vscgettext.currentMessageDefinition(editor.document, 15);
            assert.deepEqual(message, {
                msgid: 'msgid1',
                msgidLine: 15,
                msgstr: 'message 1',
                msgstrLine: 16,
                msgctxt: null,
                msgctxtLine: null,
                firstline: 15,
                lastline: 17,
            })
        }).then(done, done);
    });

    test('message definition parsing with msgctx', done => {
        openFile(inputpath('messages.po')).then(editor => {
            const message = vscgettext.currentMessageDefinition(editor.document, 27);
            assert.deepEqual(message, {
                msgid: 'agent_type',
                msgidLine: 27,
                msgstr: '',
                msgstrLine: 28,
                msgctxt: 'CorporateBody',
                msgctxtLine: 26,
                firstline: 26,
                lastline: 29,
            })
        }).then(done, done);
    });

    test('message definition with msgid on multiple lines', done => {
        openFile(inputpath('messages.po')).then(editor => {
            const message = vscgettext.currentMessageDefinition(editor.document, 31);
            assert.deepEqual(message, {
                msgid: 'Another message on several lines.',
                msgidLine: 30,
                msgstr: 'translation on several lines too.',
                msgstrLine: 32,
                msgctxt: null,
                msgctxtLine: null,
                firstline: 30,
                lastline: 34,
            })
        }).then(done, done);
    });

    test('editor jumps not next untranslated msgstr', done => {
        openFile(inputpath('messages.po')).then(editor => {
            // put the cursor somewhere in the file
            vscgettext.moveCursorTo(editor, 10, 0);
            // move to next untranslated message and check new position
            vscgettext.moveToNextUntranslatedMessage(editor);
            assertCursorAt(editor, 20, 8);
            // now move again to make sure we don't stay on current message
            vscgettext.moveToNextUntranslatedMessage(editor);
            assertCursorAt(editor, 24, 8);
        }).then(done, done);
    });

    test("editor doesn't move when on the last message of the file", done => {
        openFile(inputpath('messages.po')).then(editor => {
            // put the cursor somewhere in the file
            vscgettext.moveCursorTo(editor, 37, 0);
            // move to next untranslated message and check new position
            vscgettext.moveToNextUntranslatedMessage(editor);
            assertCursorAt(editor, 37, 0);
        }).then(done, done);
    });

    test('jump to previous untranslated message', done => {
        openFile(inputpath('messages.po')).then(editor => {
            // put the cursor somewhere in the file
            vscgettext.moveCursorTo(editor, 37, 0);
            // move to next untranslated message and check new position
            vscgettext.moveToPreviousUntranslatedMessage(editor);
            assertCursorAt(editor, 28, 8);
        }).then(done, done);
    });

    test("editor doesn't move when on the first message of the file", done => {
        openFile(inputpath('messages.po')).then(editor => {
            // put the cursor somewhere in the file
            vscgettext.moveCursorTo(editor, 10, 0);
            // move to next untranslated message and check new position
            vscgettext.moveToPreviousUntranslatedMessage(editor);
            assertCursorAt(editor, 10, 0);
        }).then(done, done);
    });

});
