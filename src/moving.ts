import * as vscode from "vscode";

export function moveCursorTo(
  editor: vscode.TextEditor,
  lineno: number,
  colno = 0
): vscode.Position {
  const position = new vscode.Position(lineno, colno);
  editor.selection = new vscode.Selection(position, position);
  return position;
}
