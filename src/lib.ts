import * as vscode from "vscode";
import { nextFuzzyMessage, nextUntranslatedMessage } from "./message";
import { focusOnNextTarget } from "./focusing";

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
