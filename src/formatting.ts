import * as vscode from "vscode";
import { exec } from "child_process";

export const provideDocumentFormattingEdits = async (
  document: vscode.TextDocument,
  _options: vscode.FormattingOptions,
  token: vscode.CancellationToken
) =>
  runMsgAttr().then((newText) => {
    const edit = vscode.TextEdit.replace(
      new vscode.Range(0, 0, document.lineCount, 0),
      newText
    );
    return token.isCancellationRequested ? [] : [edit];
  });

function runMsgAttr(): Promise<string | null> {
  const path = vscode.window.activeTextEditor?.document.uri.fsPath;

  if (!path) {
    return null;
  }

  const command = `msgattrib ${path}`;

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        vscode.window.showErrorMessage(`Failed to run msgattrib: ${stderr}`);
        reject(new Error(`Failed to run msgattrib: ${error.message}`));
      } else {
        // msgattrib printed the formatted file to stdout.
        resolve(stdout);
      }
    });
  });
}
