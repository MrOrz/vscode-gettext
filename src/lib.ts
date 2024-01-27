import * as vscode from "vscode";
import {
  Message,
  previousMessage,
  nextMessage,
  currentMessageDefinition,
} from "./message";

export function moveCursorTo(
  editor: vscode.TextEditor,
  lineno: number,
  colno = 0
): vscode.Position {
  const position = new vscode.Position(lineno, colno);
  editor.selection = new vscode.Selection(position, position);
  return position;
}

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

function nextMessagWithCondition(
  document: vscode.TextDocument,
  lineno: number,
  condition: Function,
  backwards = false
): Message {
  let message = currentMessageDefinition(document, lineno);
  const getMessage = backwards ? previousMessage : nextMessage;
  while (message !== null) {
    message = getMessage(document, message);
    if (message && condition(message)) {
      return message;
    }
  }
  return null;
}

function nextUntranslatedMessage(
  document: vscode.TextDocument,
  lineno: number,
  backwards = false
): Message {
  return nextMessagWithCondition(
    document,
    lineno,
    (message) => !message.msgstr,
    backwards
  );
}

function nextFuzzyMessage(
  document: vscode.TextDocument,
  lineno: number,
  backwards = false
): Message {
  return nextMessagWithCondition(
    document,
    lineno,
    (message) => message.isfuzzy,
    backwards
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
