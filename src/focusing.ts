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
  const [line, character] = msgstrPosition(message);
  const position = moveCursorTo(editor, line, character);
  editor.revealRange(
    new vscode.Range(position, position),
    vscode.TextEditorRevealType.InCenterIfOutsideViewport
  );
}

function msgstrPosition(message: Message): [number, number] {
  for (const [index, line] of message.msgstrPluralLine.entries()) {
    if (!message.msgstrPlural[index] || message.isfuzzy) {
      return index === 0
        ? [line, 11]
        : [line, 11 + Math.floor(Math.log10(index))];
    }
  }

  return [message.msgstrLine, 8];
}
