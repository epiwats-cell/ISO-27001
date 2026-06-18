declare module "mammoth" {
  interface ConversionResult {
    value: string;
    messages: { type: string; message: string }[];
  }
  export function convertToHtml(input: { buffer: Buffer }): Promise<ConversionResult>;
  export function convertToMarkdown(input: { buffer: Buffer }): Promise<ConversionResult>;
}
