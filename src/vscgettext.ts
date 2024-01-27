/**
 * This module is the main entry point of vscode-gettext extension
 */

import * as vscode from "vscode";
import {
  moveToNextUntranslatedMessage,
  moveToPreviousUntranslatedMessage,
  moveToNextFuzzyMessage,
  moveToPreviousFuzzyMessage,
  provideDefinition,
} from "./lib";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      "vscgettext.moveToNextUntranslated",
      moveToNextUntranslatedMessage
    )
  );
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      "vscgettext.moveToPreviousUntranslated",
      moveToPreviousUntranslatedMessage
    )
  );
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      "vscgettext.moveToNextFuzzy",
      moveToNextFuzzyMessage
    )
  );
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      "vscgettext.moveToPreviousFuzzy",
      moveToPreviousFuzzyMessage
    )
  );
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider("po", { provideDefinition })
  );
}

export function deactivate() {
  // deactivate extension
}
