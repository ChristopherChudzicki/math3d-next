// @ts-expect-error This package has types, but they aren't being picked up
// because of an error in its package.json, I believe.
// These types are copied from the package.
import { readEml as readEmlUntyped } from "eml-parse-js";

export interface KeyValue extends Object {
  [k: string]: unknown;
}

export interface EmailAddress {
  name: string;
  email: string;
}
export interface BoundaryHeaders extends KeyValue {
  "Content-Type": string;
  "Content-Transfer-Encoding"?: string;
  "Content-Disposition"?: string;
}
/**
 * EML headers
 * @description `MIME-Version`, `Accept-Language`, `Content-Language` and `Content-Type` shuld Must exist when to build a EML file
 */
export interface EmlHeaders extends KeyValue {
  Date?: string;
  Subject?: string;
  From?: string;
  To?: string;
  Cc?: string;
  CC?: string;
  "Content-Disposition"?: string | null;
  "Content-Type"?: string | null;
  "Content-Transfer-Encoding"?: string;
  "MIME-Version"?: string;
  "Content-ID"?: string;
  "Accept-Language"?: string;
  "Content-Language"?: string;
  "Content-type"?: string | null;
  "Content-transfer-encoding"?: string;
}
/**
 * read result
 */
export interface ReadedEmlJson {
  date: Date | string;
  subject: string;
  from: EmailAddress | EmailAddress[] | null;
  to: EmailAddress | EmailAddress[] | null;
  cc?: EmailAddress | EmailAddress[] | null;
  headers: EmlHeaders;
  multipartAlternative?: {
    "Content-Type": string;
  };
  text?: string;
  textheaders?: BoundaryHeaders;
  html?: string;
  htmlheaders?: BoundaryHeaders;
  attachments?: Attachment[];
  data?: string;
}
/**
 * Attachment file
 */
export interface Attachment {
  name: string;
  contentType: string;
  inline: boolean;
  data: string | Uint8Array;
  data64: string;
  filename?: string;
  mimeType?: string;
  id?: string;
  cid?: string;
}

const readEml = (eml: string): ReadedEmlJson => {
  return readEmlUntyped(eml);
};

export { readEml };
