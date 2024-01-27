import * as vscode from "vscode";
import { Message } from "./message_type";
import { documentLines, backwardDocumentLines } from "./lines";
import {
  fuzzyRgx,
  msgctxtStartRgx,
  msgidStartRgx,
  msgstrStartRgx,
  continuationLineRgx,
} from "./regex";

export class MessageParser {
  document: vscode.TextDocument;
  currentline: number;

  public constructor(document: vscode.TextDocument, currentline: number) {
    this.document = document;
    this.currentline = currentline;
  }

  public parse(): Message {
    return this.currentMessageDefinition();
  }

  private currentMessageDefinition(): Message {
    const firstline = currentMessageStart(this.document, this.currentline);
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

    for (const line of documentLines(this.document, message.firstline)) {
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
