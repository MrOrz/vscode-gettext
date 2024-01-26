/**
 * This module is the main entry point of vscode-gettext extension
 */

import * as vscode from "vscode";

const fuzzyRgx = /^#, fuzzy/;

function regexWithKey(key: string) {
  return new RegExp(`^${key}\\s+"(.*?)"\\s*$`);
}

const msgctxtStartRgx = regexWithKey("msgctxt");
const msgidStartRgx = regexWithKey("msgid");
const msgstrStartRgx = regexWithKey("msgstr");
const continuationLineRgx = /^"(.*?)\s*"$/;

type Message = {
  msgid: string;
  msgidLine: number;
  msgstr: string;
  msgstrLine: number;
  msgctxt: string;
  msgctxtLine: number;
  firstline: number;
  lastline: number;
  isfuzzy: boolean;
};

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

export function moveCursorTo(
  editor: vscode.TextEditor,
  lineno: number,
  colno = 0
): vscode.Position {
  const position = new vscode.Position(lineno, colno);
  editor.selection = new vscode.Selection(position, position);
  return position;
}

export function currentMessageDefinition(
  document: vscode.TextDocument,
  currentline: number
): Message {
  const firstline = currentMessageStart(document, currentline);
  if (firstline === null) {
    return null;
  }

  let currentProperty: string;
  const message: Message = {
    msgid: null,
    msgidLine: null,
    msgstr: null,
    msgstrLine: null,
    msgctxt: null,
    msgctxtLine: null,
    firstline: firstline.lineNumber,
    lastline: firstline.lineNumber,
    isfuzzy: false,
  };

  for (const line of documentLines(document, message.firstline)) {
    // Comments (optional), msgctxt (optional), msgid, and msgstr appear in this order.

    if (fuzzyRgx.test(line.text)) {
      if (message.msgid !== null) {
        break;
      } else {
        message.isfuzzy = true;
      }
    } else if (line.text.trim().startsWith("#") && message.msgid !== null) {
      break;
    } else if (msgctxtStartRgx.test(line.text)) {
      if (message.msgctxt !== null || message.msgid !== null) {
        break; // we are now on the next message, definition is over
      } else {
        message.msgctxt = msgctxtStartRgx.exec(line.text)[1];
        message.msgctxtLine = line.lineNumber;
        currentProperty = "msgctxt";
      }
    } else if (msgidStartRgx.test(line.text)) {
      if (message.msgid !== null) {
        break; // we are now on the next message, definition is over
      } else {
        message.msgid = msgidStartRgx.exec(line.text)[1];
        message.msgidLine = line.lineNumber;
        currentProperty = "msgid";
      }
    } else if (msgstrStartRgx.test(line.text)) {
      message.msgstr = msgstrStartRgx.exec(line.text)[1];
      message.msgstrLine = line.lineNumber;
      currentProperty = "msgstr";
    } else if (continuationLineRgx.test(line.text)) {
      message[currentProperty] += continuationLineRgx.exec(line.text)[1];
    }
    message.lastline++;
  }

  message.lastline--; // last line is the one before the next message definition

  return message;
}

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

export function provideDefinition(
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

function focusOnMessage(editor: vscode.TextEditor, message: Message) {
  const position = moveCursorTo(editor, message.msgstrLine, 8);
  editor.revealRange(
    new vscode.Range(position, position),
    vscode.TextEditorRevealType.InCenterIfOutsideViewport
  );
}

function* documentLines(document: vscode.TextDocument, startline = 1) {
  for (let lineno = startline; lineno < document.lineCount; lineno++) {
    yield document.lineAt(lineno);
  }
}

function* backwardDocumentLines(
  document: vscode.TextDocument,
  startline = document.lineCount - 1
) {
  for (let lineno = startline; lineno >= 0; lineno--) {
    yield document.lineAt(lineno);
  }
}

function nextMessage(
  document: vscode.TextDocument,
  currentMessage: Message
): Message {
  for (const line of documentLines(document, currentMessage.lastline + 1)) {
    if (line.text && !line.text.trim().startsWith("#")) {
      return currentMessageDefinition(document, line.lineNumber);
    }
  }
  return null;
}

function previousMessage(
  document: vscode.TextDocument,
  currentMessage: Message
): Message {
  for (const line of backwardDocumentLines(
    document,
    currentMessage.firstline - 1
  )) {
    if (line.text && !line.text.trim().startsWith("#")) {
      return currentMessageDefinition(document, line.lineNumber);
    }
  }
  return null;
}

function currentMessageStart(
  document: vscode.TextDocument,
  currentLine: number
): vscode.TextLine {
  let startLine = null;

  // go backwards to msgid definition
  for (const line of backwardDocumentLines(document, currentLine)) {
    if (msgstrStartRgx.test(line.text) && startLine !== null) {
      // we hit a msgstr but we already hit a msgid definition, it means
      // that we've reached another message definition, return the line of
      // the msgid hit.
      return startLine;
    }

    const isComment = line.text && line.text.trim().startsWith("#");

    if (
      isComment ||
      msgctxtStartRgx.test(line.text) ||
      msgidStartRgx.test(line.text) ||
      msgstrStartRgx.test(line.text)
    ) {
      startLine = line;
    }
  }

  // if we've reached the beginning of the file, msgidLine won't have been set
  // and we'll return null in that case.
  return startLine;
}

function nextMessagWithCondition(
  document: vscode.TextDocument,
  lineno: number,
  condition: Function,
  backwards = false
): Message {
  let message = currentMessageDefinition(document, lineno);
  const getMessage = backwards ? previousMessage : nextMessage;
  while (message !== null) {
    message = getMessage(document, message);
    if (message && condition(message)) {
      return message;
    }
  }
  return null;
}

function nextUntranslatedMessage(
  document: vscode.TextDocument,
  lineno: number,
  backwards = false
): Message {
  return nextMessagWithCondition(
    document,
    lineno,
    (message) => !message.msgstr,
    backwards
  );
}

function nextFuzzyMessage(
  document: vscode.TextDocument,
  lineno: number,
  backwards = false
): Message {
  return nextMessagWithCondition(
    document,
    lineno,
    (message) => message.isfuzzy,
    backwards
  );
}

function focusOnNextTarget(
  editor: vscode.TextEditor,
  nextTargetFunc: Function,
  backwards = false
) {
  const position = editor.selection.active;
  const message = nextTargetFunc(editor.document, position.line, backwards);
  if (message !== null) {
    focusOnMessage(editor, message);
  }
}
