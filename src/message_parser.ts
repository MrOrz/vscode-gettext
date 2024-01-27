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
  message: Message;

  public constructor(document: vscode.TextDocument, currentline: number) {
    this.document = document;
    this.currentline = currentline;
    this.message = {
      msgid: null,
      msgidLine: null,
      msgstr: null,
      msgstrLine: null,
      msgctxt: null,
      msgctxtLine: null,
      firstline: null,
      lastline: null,
      isfuzzy: false,
    };
  }

  public parse(): Message {
    const firstline = this.currentMessageStart();
    if (firstline === null) {
      return null;
    }

    this.message.firstline = firstline.lineNumber;
    this.message.lastline = firstline.lineNumber;

    let currentProperty: string;
    for (const line of documentLines(this.document, this.message.firstline)) {
      // Comments (optional), msgctxt (optional), msgid, and msgstr appear in this order.

      if (fuzzyRgx.test(line.text)) {
        if (this.message.msgid !== null) {
          break;
        } else {
          this.message.isfuzzy = true;
        }
      } else if (
        line.text.trim().startsWith("#") &&
        this.message.msgid !== null
      ) {
        break;
      } else if (msgctxtStartRgx.test(line.text)) {
        if (this.message.msgctxt !== null || this.message.msgid !== null) {
          break; // we are now on the next message, definition is over
        } else {
          this.message.msgctxt = msgctxtStartRgx.exec(line.text)[1];
          this.message.msgctxtLine = line.lineNumber;
          currentProperty = "msgctxt";
        }
      } else if (msgidStartRgx.test(line.text)) {
        if (this.message.msgid !== null) {
          break; // we are now on the next message, definition is over
        } else {
          this.message.msgid = msgidStartRgx.exec(line.text)[1];
          this.message.msgidLine = line.lineNumber;
          currentProperty = "msgid";
        }
      } else if (msgstrStartRgx.test(line.text)) {
        this.message.msgstr = msgstrStartRgx.exec(line.text)[1];
        this.message.msgstrLine = line.lineNumber;
        currentProperty = "msgstr";
      } else if (continuationLineRgx.test(line.text)) {
        this.message[currentProperty] += continuationLineRgx.exec(line.text)[1];
      }
      this.message.lastline++;
    }

    this.message.lastline--; // last line is the one before the next message definition

    return this.message;
  }

  private currentMessageStart(): vscode.TextLine {
    let startLine = null;

    // go backwards to msgid definition
    for (const line of backwardDocumentLines(this.document, this.currentline)) {
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
}
