declare module 'html-to-docx' {
  function HTMLtoDOCX(
    htmlString: string,
    headerHTMLString?: string | null,
    options?: {
      table?: { row?: { cantSplit?: boolean } };
      footer?: boolean;
      pageNumber?: boolean;
      font?: string;
      fontSize?: number;
      [key: string]: unknown;
    }
  ): Promise<Buffer>;

  export default HTMLtoDOCX;
}
