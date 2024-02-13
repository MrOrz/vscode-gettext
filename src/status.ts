import * as vscode from "vscode";
import { exec } from "child_process";

let statusBarItem: vscode.StatusBarItem;

export async function activateStatusBar({
  subscriptions,
}: vscode.ExtensionContext): Promise<void> {
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    0
  );

  statusBarItem.show();
  subscriptions.push(statusBarItem);

  subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(updateStsatusBarmItem)
  );

  updateStsatusBarmItem();
}

async function updateStsatusBarmItem(): Promise<void> {
  statusBarItem.text = await runMsgfmtStatistics();
}

async function runMsgfmtStatistics(): Promise<string> {
  const path = vscode.window.activeTextEditor?.document.uri.fsPath;

  const command = `msgfmt --statistics -o /dev/null ${path}`;

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      // Correct. The command will print the statistics to stderr.
      resolve(stderr);
    });
  });
}
