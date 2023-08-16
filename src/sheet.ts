import { Report } from "./report";
import * as Lo from "./layout";

export abstract class Sheet {
  private __rpt: Report;
  private __sheet: string;
  private __tmpltSheet: string;
  private __page: Lo.Page;
  private __tokenNumber: number = 0;
  private __pageNumber: number = 0;
  private __totalPageNum: number = -1;
  private __pageBreakNumber: number = 0;
  private __pageRows: number[] = [];
  private __tokenRows: number[] = [];
  private __totalRows: number[] = [];
  private __rows: Lo.ElemType[] = [];

  protected get _rpt () {return this.__rpt};
  protected get _sheet () {return this.__sheet};
  protected get _tmpltSheet () {return this.__tmpltSheet};
  protected get _rowNumber () {return this.__rows.length};
  protected get _tokenNumber () {return this.__tokenNumber};
  protected get _pageNumber () {return this.__pageNumber};
  protected get _pageBreakNumber () {return this.__pageBreakNumber};
  protected get _pageRows () {return this.__pageRows.slice()};
  protected get _tokenRows () {return this.__tokenRows.slice()};
  protected get _totalRows () {return this.__totalRows.slice()};
  protected get _rows () {return this.__rows.slice()};

  protected get _totalPageNum () {
    if (this.__totalPageNum == -1) {
      let num = 0;
      this.__page.forEach(elem => {
        if (elem.type == Lo.ElemType.firstTitle ||
            elem.type == Lo.ElemType.otherTitle) {
          num++;
        }
      });
      this.__totalPageNum = num;
    }
    return this.__totalPageNum;
  }

  constructor (report: Report, sheetIndex: number, sheet: string,
               tmpltSheet: string, page: Lo.Page) {
    this.__rpt = report;
    this.__rpt.addSheet(sheetIndex, sheet, tmpltSheet);
    this.__sheet = sheet;
    this.__tmpltSheet = tmpltSheet;
    this.__page = page;
  }

  public makePage (): number {
    let page = this.__page;
    page.forEach(elem => {
      if (elem.type == Lo.ElemType.firstTitle) {
        this._appendFirstTitle(elem);
      } else if (elem.type == Lo.ElemType.otherTitle) {
        this._appendOtherTitle(elem);
      } else if (elem.type == Lo.ElemType.tokenTitle) {
        this._appendTokenTitle(elem);
      } else if (elem.type == Lo.ElemType.data) {
        this._appendData(elem);
      } else if (elem.type == Lo.ElemType.empty) {
        this._appendEmpty(elem);
      } else if (elem.type == Lo.ElemType.tokenPageEnd) {
        this._appendPageEnd(elem);
      } else if (elem.type == Lo.ElemType.tokenEnd) {
        this._appendTokenEnd(elem);
      } else if (elem.type == Lo.ElemType.otherEnd) {
        this._appendOtherEnd(elem);
      } else { // lastEnd
        this._appendLastEnd(elem);
      }
      elem.rows.forEach((row, i) => {
        this.__rpt.setRowHeight(this.__sheet,
                                  this._rowNumber - elem.rows.length + 1 + i,
                                  row.height + row.hgtAdj);
      })
    });
    this._setSheetHeaderAndFooter();
    return this._totalPageNum;
  }

  /** @returns insert page break success */
  protected _safelyInsertPageBreak (insertRowNum: number): boolean {
    if (insertRowNum >= 2) {
      this.__rpt.setRowPageBreak(this.__sheet, insertRowNum);
      this.__pageBreakNumber++;
      return true;
    }
    return false;
  }

  /** @returns start row number, end row number */
  protected _appendFirstTitle (elem: Lo.Elem): [number, number] {
    let res = this.__addElem(elem);
    this.__pageNumber++;
    this.__pageRows = [];
    this.__tokenRows = [];
    this.__totalRows = [];
    return res;
  }

  /** @returns start row number, end row number */
  protected _appendOtherTitle (elem: Lo.Elem): [number, number] {
    let res = this.__addElem(elem);
    this.__pageNumber++;
    this.__pageRows = [];
    return res;
  }

  /** @returns start row number, end row number */
  protected _appendTokenTitle (elem: Lo.Elem): [number, number] {
    let res = this.__addElem(elem);
    this.__tokenNumber++;
    this.__tokenRows = [];
    return res;
  }

  /** @returns start row number, end row number */
  protected _appendData (elem: Lo.Elem): [number, number] {
    let res = this.__addElem(elem);
    this.__pageRows.push(res[0]);
    this.__tokenRows.push(res[0]);
    this.__totalRows.push(res[0]);
    return res;
  }

  /** @returns start row number, end row number, previous row is not empty */
  protected _appendEmpty (elem: Lo.Elem): [number, number, boolean] {
    let res = this.__addElem(elem);
    return [res[0], res[1], this.__rows[res[0] - 2] != Lo.ElemType.empty];
  }

  /** @returns start row number, end row number */
  protected _appendPageEnd (elem: Lo.Elem): [number, number] {
    let res = this.__addElem(elem);
    return res;
  }

  /** @returns start row number, end row number */
  protected _appendTokenEnd (elem: Lo.Elem): [number, number] {
    let res = this.__addElem(elem);
    return res;
  }

  /** @returns start row number, end row number */
  protected _appendOtherEnd (elem: Lo.Elem): [number, number] {
    let res = this.__addElem(elem);
    return res;
  }

  /** @returns start row number, end row number */
  protected _appendLastEnd (elem: Lo.Elem): [number, number] {
    let res = this.__addElem(elem);
    return res;
  }

  protected _setSheetHeaderAndFooter (): void {}

  /** @returns start row number, end row number */
  private __addElem (elem: Lo.Elem): [number, number] {
    elem.rows.forEach(row => {
      this.__rows.push(elem.type);
      this.__rpt.addRow(this.__sheet, this.__tmpltSheet,
                           row.tmpltRowNumber);
    });
    return [this._rowNumber - elem.rows.length + 1, this._rowNumber + 1];
  }
}
