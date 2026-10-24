declare module 'html2pdf.js' {
    interface Html2PdfOptions {
        margin?: number | number[];
        filename?: string;
        image?: { type?: string; quality?: number };
        html2canvas?: Record<string, unknown>;
        jsPDF?: { unit?: string; format?: string; orientation?: string };
        pagebreak?: { mode?: string[] | string };
    }

    interface Html2PdfInstance {
        from(element: HTMLElement | string): Html2PdfInstance;
        set(opt: Html2PdfOptions): Html2PdfInstance;
        save(): Promise<void>;
        output(type: 'blob'): Promise<Blob>;
        output(type: string): Promise<unknown>;
    }

    function html2pdf(): Html2PdfInstance;
    function html2pdf(element: HTMLElement | string, opt?: Html2PdfOptions): Promise<void>;

    export default html2pdf;
}
