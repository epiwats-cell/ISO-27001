declare module "html-to-docx" {
  function HtmlToDocx(
    html: string,
    headerHTMLString: string | null,
    options?: Record<string, unknown>
  ): Promise<Buffer | ArrayBuffer>;
  export default HtmlToDocx;
}
