import * as vscode from "vscode";

export default function (
  document: vscode.TextDocument,
  position: vscode.Position,
  token: vscode.CancellationToken
) {
  // Extract the line text and check if it is a comment with a source file reference
  const poLine = document.lineAt(position).text;
  if (poLine.startsWith("#: ") && poLine.split(" ").length > 1) {
    const sourceLocation = poLine.split(" ")[1].split(":");
    if (sourceLocation.length === 2) {
      // Get the source file path
      const sourceFile = sourceLocation[0];
      // Get the line number (vscode uses 0-based line numbers)
      const sourceLine: number = +sourceLocation[1] - 1;
      // Find files in the workspace matching the source file
      return vscode.workspace.findFiles(sourceFile).then((value) => {
        if (!value) {
          return;
        }

        // Set the source position to the 0th character of the line number
        const sourcePosition = new vscode.Position(sourceLine, 0);

        // Set the position for every matching file in the workspace
        const locations: vscode.Location[] = [];
        value.forEach((uri) => {
          locations.push(new vscode.Location(uri, sourcePosition));
        });
        return locations;
      });
    }
  }
}
