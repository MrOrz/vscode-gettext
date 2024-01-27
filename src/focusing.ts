import * as vscode from "vscode";
import { Message } from "./message_type";
import { moveCursorTo } from "./moving";

export function focusOnNextTarget(
  editor: vscode.TextEditor,
  nextTargetFunc: (
    editor: vscode.TextDocument,
    lineno: number,
    backwards: boolean
  ) => Message,
  backwards = false
) {
  const position = editor.selection.active;
  const message = nextTargetFunc(editor.document, position.line, backwards);
  if (message !== null) {
    focusOnMessage(editor, message);
  }
}

function focusOnMessage(editor: vscode.TextEditor, message: Message) {
  const position = moveCursorTo(editor, message.msgstrLine, 8);
  editor.revealRange(
    new vscode.Range(position, position),
    vscode.TextEditorRevealType.InCenterIfOutsideViewport
  );
}
