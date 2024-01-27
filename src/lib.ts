import * as vscode from "vscode";
import { Message, nextFuzzyMessage, nextUntranslatedMessage } from "./message";
import { moveCursorTo } from "./moving";

export function moveToNextUntranslatedMessage(editor: vscode.TextEditor) {
  focusOnNextTarget(editor, nextUntranslatedMessage);
}

export function moveToPreviousUntranslatedMessage(editor: vscode.TextEditor) {
  focusOnNextTarget(editor, nextUntranslatedMessage, true);
}

export function moveToNextFuzzyMessage(editor: vscode.TextEditor) {
  focusOnNextTarget(editor, nextFuzzyMessage);
}

export function moveToPreviousFuzzyMessage(editor: vscode.TextEditor) {
  focusOnNextTarget(editor, nextFuzzyMessage, true);
}

function focusOnMessage(editor: vscode.TextEditor, message: Message) {
  const position = moveCursorTo(editor, message.msgstrLine, 8);
  editor.revealRange(
    new vscode.Range(position, position),
    vscode.TextEditorRevealType.InCenterIfOutsideViewport
  );
}
function focusOnNextTarget(
  editor: vscode.TextEditor,
  nextTargetFunc: Function,
  backwards = false
) {
  const position = editor.selection.active;
  const message = nextTargetFunc(editor.document, position.line, backwards);
  if (message !== null) {
    focusOnMessage(editor, message);
  }
}
