/**
 * vsgettext extension tests
 */

import { assert } from "chai";
import { join as pathjoin } from "path";

import * as vscode from "vscode";
import * as vscgettext from "../src/lib";
import { moveCursorTo } from "../src/moving";

function inputpath(basename: string): string {
  return pathjoin(__dirname, "..", "..", "test", "inputfiles", basename);
}

function assertCursorAt(
  editor: vscode.TextEditor,
  lineno: number,
  colno: number
) {
  const selection = editor.selection.active;
  const actualPos = { lineno: selection.line, colno: selection.character };
  assert.deepEqual(actualPos, { lineno, colno });
}

function openFile(path): Thenable<vscode.TextEditor> {
  return vscode.workspace.openTextDocument(path).then((document) => {
    return vscode.window.showTextDocument(document);
  });
}

suite("Helper functions", () => {
  test("`moveCursorTo` moves the cursor to the correct position", (done) => {
    openFile(inputpath("messages.po"))
      .then((editor) => {
        moveCursorTo(editor, 10, 0);
        assertCursorAt(editor, 10, 0);
      })
      .then(done, done);
  });
});

suite("vscode-gettext tests", () => {
  test("editor jumps not next untranslated msgstr", (done) => {
    openFile(inputpath("messages.po"))
      .then((editor) => {
        // put the cursor somewhere in the file
        moveCursorTo(editor, 10, 0);
        // move to next untranslated message and check new position
        vscgettext.moveToNextUntranslatedMessage(editor);
        assertCursorAt(editor, 20, 8);
        // now move again to make sure we don't stay on current message
        vscgettext.moveToNextUntranslatedMessage(editor);
        assertCursorAt(editor, 24, 8);
      })
      .then(done, done);
  });

  test("editor doesn't move when on the last message of the file", (done) => {
    openFile(inputpath("messages.po"))
      .then((editor) => {
        // put the cursor somewhere in the file
        moveCursorTo(editor, 53, 0);
        // move to next untranslated message and check new position
        vscgettext.moveToNextUntranslatedMessage(editor);
        assertCursorAt(editor, 53, 0);
      })
      .then(done, done);
  });

  test("jump to previous untranslated message", (done) => {
    openFile(inputpath("messages.po"))
      .then((editor) => {
        // put the cursor somewhere in the file
        moveCursorTo(editor, 37, 0);
        // move to next untranslated message and check new position
        vscgettext.moveToPreviousUntranslatedMessage(editor);
        assertCursorAt(editor, 28, 8);
      })
      .then(done, done);
  });

  test("editor doesn't move when on the first message of the file", (done) => {
    openFile(inputpath("messages.po"))
      .then((editor) => {
        // put the cursor somewhere in the file
        moveCursorTo(editor, 10, 0);
        // move to next untranslated message and check new position
        vscgettext.moveToPreviousUntranslatedMessage(editor);
        assertCursorAt(editor, 10, 0);
      })
      .then(done, done);
  });

  test("jump to the previous fuzzy message", (done) => {
    openFile(inputpath("messages.po"))
      .then((editor) => {
        // put the cursor somewhere in the file
        moveCursorTo(editor, 42, 0);
        // move to next fuzzy message and check new position
        vscgettext.moveToPreviousFuzzyMessage(editor);
        assertCursorAt(editor, 38, 8);
      })
      .then(done, done);
  });

  test("jump to the next fuzzy message", (done) => {
    openFile(inputpath("messages.po"))
      .then((editor) => {
        // put the cursor somewhere in the file
        moveCursorTo(editor, 10, 0);
        // move to next fuzzy message and check new position
        vscgettext.moveToNextFuzzyMessage(editor);
        assertCursorAt(editor, 38, 8);
      })
      .then(done, done);
  });

  test("jump to the next untranslated singular message", (done) => {
    openFile(inputpath("messages.po"))
      .then((editor) => {
        // put the cursor somewhere in the file
        moveCursorTo(editor, 43, 0);
        // move to next untranslated singular message and check new position
        vscgettext.moveToNextUntranslatedMessage(editor);
        assertCursorAt(editor, 46, 11);
      })
      .then(done, done);
  });

  test("jump to the previous untranslated singular message", (done) => {
    openFile(inputpath("messages.po"))
      .then((editor) => {
        // put the cursor somewhere in the file
        moveCursorTo(editor, 48, 0);
        // move to next untranslated singular message and check new position
        vscgettext.moveToPreviousUntranslatedMessage(editor);
        assertCursorAt(editor, 46, 11);
      })
      .then(done, done);
  });

  test("jump to the next untranslated plural message", (done) => {
    openFile(inputpath("messages.po"))
      .then((editor) => {
        // put the cursor on the first untranslated plural message
        moveCursorTo(editor, 48, 0);
        // move to next untranslated plural message and check new position
        vscgettext.moveToNextUntranslatedMessage(editor);
        assertCursorAt(editor, 52, 11);
      })
      .then(done, done);
  });
});
