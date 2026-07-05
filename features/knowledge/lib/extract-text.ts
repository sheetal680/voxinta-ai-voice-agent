import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import type { DocumentType } from "../constants";

/**
 * Extract plain text from an uploaded document buffer. SERVER-ONLY (Node
 * runtime — pdf-parse/mammoth both expect Node Buffers).
 */
export async function extractText(buffer: Buffer, type: DocumentType): Promise<string> {
  switch (type) {
    case "pdf": {
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        return result.text;
      } finally {
        await parser.destroy();
      }
    }
    case "docx": {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    case "txt":
    case "md":
      return buffer.toString("utf-8");
  }
}
