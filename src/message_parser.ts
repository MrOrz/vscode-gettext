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

    this.parseComments();
    this.parseMsgctxt();
    this.parseMsgid();
    this.parseMsgstr();

    return this.message;
  }

  private parseComments() {
    for (const line of documentLines(this.document, this.message.lastline)) {
      if (!line.text.trim().startsWith("#")) {
        return;
      }

      this.message.lastline++;

      if (fuzzyRgx.test(line.text)) {
        this.message.isfuzzy = true;
      }
    }
  }

  private parseMsgctxt() {
    let firstLine = this.document.lineAt(this.message.lastline);

    if (!msgctxtStartRgx.test(firstLine.text)) {
      return;
    }

    this.message.msgctxt = msgctxtStartRgx.exec(firstLine.text)[1];
    this.message.msgctxtLine = firstLine.lineNumber;
    this.message.lastline++;

    for (const line of documentLines(this.document, this.message.lastline)) {
      if (continuationLineRgx.test(line.text)) {
        this.message.msgctxt += continuationLineRgx.exec(line.text)[1];
        this.message.lastline++;
      } else {
        return;
      }
    }
  }

  private parseMsgid() {
    let firstLine = this.document.lineAt(this.message.lastline);

    if (!msgidStartRgx.test(firstLine.text)) {
      return;
    }

    this.message.msgid = msgidStartRgx.exec(firstLine.text)[1];
    this.message.msgidLine = firstLine.lineNumber;
    this.message.lastline++;

    for (const line of documentLines(this.document, this.message.lastline)) {
      if (continuationLineRgx.test(line.text)) {
        this.message.msgid += continuationLineRgx.exec(line.text)[1];
        this.message.lastline++;
      } else {
        return;
      }
    }
  }

  private parseMsgstr() {
    let firstLine = this.document.lineAt(this.message.lastline);

    if (!msgstrStartRgx.test(firstLine.text)) {
      return;
    }

    this.message.msgstr = msgstrStartRgx.exec(firstLine.text)[1];
    this.message.msgstrLine = firstLine.lineNumber;
    this.message.lastline++;

    for (const line of documentLines(this.document, this.message.lastline)) {
      if (continuationLineRgx.test(line.text)) {
        this.message.msgstr += continuationLineRgx.exec(line.text)[1];
        this.message.lastline++;
      } else {
        return;
      }
    }
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
