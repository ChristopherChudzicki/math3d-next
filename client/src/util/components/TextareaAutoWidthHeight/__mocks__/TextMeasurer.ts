/* eslint-disable class-methods-use-this */
import { ITextMeasurer } from "../TextMeasurer";

const fakeTextMetrics = (): TextMetrics => ({
  actualBoundingBoxAscent: 1,
  actualBoundingBoxDescent: 1,
  actualBoundingBoxLeft: 1,
  actualBoundingBoxRight: 1,
  fontBoundingBoxAscent: 1,
  fontBoundingBoxDescent: 1,
  width: 1,
});

export default class TextMeasurer implements ITextMeasurer {
  measure = () => [fakeTextMetrics()];
}
