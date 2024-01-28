import * as vscode from "vscode";

export function* documentLines(document: vscode.TextDocument, startline = 0) {
  for (let lineno = startline; lineno < document.lineCount; lineno++) {
    yield document.lineAt(lineno);
  }
}

export function* backwardDocumentLines(
  document: vscode.TextDocument,
  startline = document.lineCount - 1
) {
  for (let lineno = startline; lineno >= 0; lineno--) {
    yield document.lineAt(lineno);
  }
}
