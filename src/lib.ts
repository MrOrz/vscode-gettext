import * as vscode from "vscode";
import {
  nextFuzzyMessage,
  nextUntranslatedMessage,
  nextUntranslatedOrFuzzyMessage,
} from "./message";
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

export function moveToNextUntranslatedOrFuzzyMessage(
  editor: vscode.TextEditor
) {
  focusOnNextTarget(editor, nextUntranslatedOrFuzzyMessage);
}

export function moveToPreviousUntranslatedOrFuzzyMessage(
  editor: vscode.TextEditor
) {
  focusOnNextTarget(editor, nextUntranslatedOrFuzzyMessage, true);
}
