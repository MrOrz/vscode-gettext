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
    vscode.window.onDidChangeActiveTextEditor(updateStsatusBarItem)
  );

  updateStsatusBarItem();
}

async function updateStsatusBarItem(): Promise<void> {
  const output = await runMsgfmtStatistics();

  if (output) {
    statusBarItem.text = output;
    statusBarItem.show();
  } else {
    statusBarItem.hide();
  }
}

async function runMsgfmtStatistics(): Promise<string | null> {
  const path = vscode.window.activeTextEditor?.document.uri.fsPath;

  if (!path) {
    return null;
  }

  const command = `msgfmt --statistics -o /dev/null ${path}`;

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      console.log("error: ", error);
      console.log("stdout: ", stdout);
      console.log("stderr: ", stderr);

      // Correct. The command will print the statistics to stderr.
      resolve(stderr);
    });
  });
}
