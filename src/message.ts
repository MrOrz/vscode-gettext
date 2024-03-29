import * as vscode from "vscode";
import { MessageParser } from "./message_parser";
import { Message } from "./message_type";
import { documentLines, backwardDocumentLines } from "./lines";

export function nextUntranslatedMessage(
  document: vscode.TextDocument,
  lineno: number,
  backwards = false
): Message {
  return nextMessageWithCondition(document, lineno, isUntranslated, backwards);
}

export function nextFuzzyMessage(
  document: vscode.TextDocument,
  lineno: number,
  backwards = false
): Message {
  return nextMessageWithCondition(
    document,
    lineno,
    (message: Message) => message.isfuzzy,
    backwards
  );
}

export function nextUntranslatedOrFuzzyMessage(
  document: vscode.TextDocument,
  lineno: number,
  backwards = false
): Message {
  return nextMessageWithCondition(
    document,
    lineno,
    (message: Message) => isUntranslated(message) || message.isfuzzy,
    backwards
  );
}

function nextMessageWithCondition(
  document: vscode.TextDocument,
  lineno: number,
  condition: Function,
  backwards = false
): Message {
  let message = parseMessage(document, lineno);
  const getMessage = backwards ? previousMessage : nextMessage;
  while (message !== null) {
    message = getMessage(document, message);
    if (message && condition(message)) {
      return message;
    }
  }
  return null;
}

function nextMessage(
  document: vscode.TextDocument,
  currentMessage: Message
): Message {
  for (const line of documentLines(document, currentMessage.lastline + 1)) {
    if (line.text && !line.text.trim().startsWith("#")) {
      return parseMessage(document, line.lineNumber);
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
      return parseMessage(document, line.lineNumber);
    }
  }
  return null;
}

function parseMessage(document: vscode.TextDocument, lineno: number): Message {
  return new MessageParser(document, lineno).parse();
}

function isUntranslated(message: Message): boolean {
  return !isTranslated(message);
}

function isTranslated(message: Message): boolean {
  return (
    (message.msgstr && message.msgstr !== "") ||
    (message.msgstrPlural &&
      message.msgstrPlural.length > 0 &&
      message.msgstrPlural.every((msgstr) => msgstr !== ""))
  );
}
