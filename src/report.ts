export class Report {
  private static readonly SeparatorItem = "|";
  private static readonly SeparatorCell = ",";
  private static readonly SeparatorInfo = ":";
  private static readonly SeparatorValue = "/";
  private static readonly CellValueTypeString = "s";
  private static readonly CellValueTypeBool = "b";
  private static readonly CellValueTypeNumber = "n";
  private static readonly CellValueTypeDate = "d";
  private static readonly CellValueTypeFormula = "f";
  private static readonly CellValueTypeHyperLink = "l";
  private static readonly CellValueTypeClear = "c";

  private static readonly TotalColumns = 16384;

  // title, theme, creator, keywords, description, last modified by user,
  // language, identifier, revision, status, category, version, default sheet
  private doc: string[] = [];

  // value [name, templet, hide, password, printArea, defaultSheet,
  // columnVisible, columnWidth, header, footer]
  // private sheets = new Map<string, string[]>();
  private sheets: string[][] = [];

  // value [templet sheet, templet row, height, hide, page break, replace mode][]
  private rows = new Map<string, string[][]>();

  // value [templet sheet, templet cell, name, merge, pictrue,
  // comment, replace mode][][]
  private cells = new Map<string, string[][][]>();

  private cellsValue = new Map<string, string[][]>();

  constructor () {
  }

  public getPrintStr (): string {
    let str = this.getPrintStr_doc() + "\n";
    this.sheets.forEach(sheetConfig => {
      let sheetName = sheetConfig[0];
      str += this.getPrintStr_Sheet(sheetConfig) + "\n";
      let rowsConfig = this.rows.get(sheetName) || [];
      let cellsConfig = this.cells.get(sheetName) || [];
      let cellsValue = this.cellsValue.get(sheetName) || [];
      let row_count = Math.max(rowsConfig.length, cellsConfig.length,
                               cellsValue.length);
      for (let i = 0; i < row_count; ++i) {
        let rowConfig = rowsConfig[i] || [];
        let cellConfig = cellsConfig[i] || [];
        let cellValue = cellsValue[i] || [];
        str += this.getPrintStr_Row(rowConfig, cellConfig, cellValue) + "\n";
      }
    });
    return str;
  }

  // public print (program: string, templet: string, output: string,
  //               printStr: string) {
  // }

  public setDocTitle (title: string) {
    this.doc[0] = title;
  }

  public setDocTheme (theme: string) {
    this.doc[1] = theme;
  }

  public setDocCreator (creator: string) {
    this.doc[2] = creator;
  }

  public setDocKeywords (keywords: string) {
    this.doc[3] = keywords;
  }

  public setDocDescription (description: string) {
    this.doc[4] = description;
  }

  public setDocLastModifiedByUser (user: string) {
    this.doc[5] = user;
  }

  public setDocLanguage (language: string) {
    this.doc[6] = language;
  }

  public setDocIdentifier (identifier: string) {
    this.doc[7] = identifier;
  }

  public setDocRevision (revision: string) {
    this.doc[8] = revision;
  }

  public setDocStatus (status: string) {
    this.doc[9] = status;
  }

  public setDocCategory (category: string) {
    this.doc[10] = category;
  }

  public setDocVersion (version: string) {
    this.doc[11] = version;
  }

  public setDocDefaultSheet (sheetName: string) {
    this.doc[12] = sheetName;
  }

  public addSheet (index: number, name: string, templet: string = "") {
    if (index < 0) {
      throw new Error("sheet index cannot less than zero");
    }
    this.sheets[index] = [name, templet];
  }

  public getSheetCount (): number {
    return this.sheets.length;
  }

  private getSheetIndex (name: string): number {
    for (let i = 0; i < this.sheets.length; ++i) {
      if (this.sheets[i][0] == name) {
        return i;
      }
    }
    return -1;
  }

  public setSheetHide (name: string) {
    this.sheets[this.getSheetIndex(name)][2] = "";
  }

  public setSheetPassword (name: string, password: string) {
    this.sheets[this.getSheetIndex(name)][3] = password;
  }

  public setSheetPrintArea (name: string, printArea: string) {
    this.sheets[this.getSheetIndex(name)][4] = printArea;
  }

  public setSheetDefaultSheet (name: string) {
    this.sheets[this.getSheetIndex(name)][5] = "";
  }

  public setSheetColumnNotVisible (name: string, column: number) {
    let value = this.sheets[this.getSheetIndex(name)];
    if (value[6] == undefined) {
      value[6] = "" + column;
    } else {
      value[6] = value[6] + Report.SeparatorValue + column;
    }
  }

  public setSheetColumnWidth (name: string, column: number, width: number) {
    let value = this.sheets[this.getSheetIndex(name)];
    let str = "";
    if (value[7] == undefined) {
      for (let i = 1; i < column; ++i) {
        str += Report.SeparatorValue;
      }
      str += width;
    } else {
      let widths = value[7].split(Report.SeparatorValue);
      widths[column - 1] = "" + width;
      for (let i = 0; i < widths.length; ++i) {
        if (widths[i] != undefined) {
          str += widths[i];
        }
        if (i != widths.length - 1) {
          str += Report.SeparatorValue;
        }
      }
    }
    value[7] = str;
  }

  public setSheetHeader (name: string, firstHeader: string,
                         oddHeader: string = firstHeader,
                         evenHeader: string = oddHeader) {
    const sep = Report.SeparatorValue;
    this.sheets[this.getSheetIndex(name)][8] = 
      this.escapeString(firstHeader, sep) + sep +
      this.escapeString(oddHeader, sep) + sep +
      this.escapeString(evenHeader, sep, true);
  }

  public setSheetFooter (name: string, firstFooter: string,
                         oddFooter: string = firstFooter,
                         evenFooter: string = oddFooter) {
    const sep = Report.SeparatorValue;
    this.sheets[this.getSheetIndex(name)][9] = 
      this.escapeString(firstFooter, sep) + sep +
      this.escapeString(oddFooter, sep) + sep +
      this.escapeString(evenFooter, sep, true);
  }

  private prepareSetSheetConf (name: string) {
    let conf = this.sheets[this.getSheetIndex(name)];
    if (conf == undefined) {
      this.sheets[this.getSheetIndex(name)] = [];
    }
  }

  public addRow (sheetName: string, templetSheet: string,
                 templetRow: number, rowNumber?: number): number {
    if (this.rows.get(sheetName) == undefined) {
      if (rowNumber == undefined) {
        this.rows.set(sheetName, [[templetSheet, "" + templetRow]]);
      } else {
        this.rows.set(sheetName, [[templetSheet, "" + templetRow]]);
      }
    } else {
      this.rows.get(sheetName).push([templetSheet, "" + templetRow]);
    }
    return this.rows.get(sheetName).length;
  }

  public setRowHeight (sheetName: string, row: number, height: number) {
    this.rows.get(sheetName)[row - 1][2] = "" + height;
  }

  public setRowHide (sheetName: string, row: number) {
    this.rows.get(sheetName)[row - 1][3] = "";
  }

  public setRowPageBreak (sheetName: string, row: number) {
    this.rows.get(sheetName)[row - 1][4] = "";
  }

  public setRowReplaceMode (sheetName: string, row: number, replace: string) {
    this.rows.get(sheetName)[row - 1][5] = replace;
  }

  private prepareSetCellConfig (sheetName: string, row: number, col: number) {
    if (this.cells.get(sheetName) == undefined) {
      let rows: string[][][] = [];
      rows[row - 1] = [];
      rows[row - 1][col - 1] = [];
      this.cells.set(sheetName, rows);
    } else {
      let rows = this.cells.get(sheetName);
      if (rows[row - 1] == undefined) {
        let r: string[][] = [];
        r[col - 1] = [];
        rows[row - 1] = r;
      } else {
        let r = rows[row - 1];
        if (r[col - 1] == undefined) {
          r[col - 1] = [];
        }
      }
    }
  }

  private prepareSetCellValue (sheetName: string, row: number) {
    if (this.cellsValue.get(sheetName) == undefined) {
      let rows: string[][] = [];
      rows[row - 1] = [];
      this.cellsValue.set(sheetName, rows);
    } else {
      let rows = this.cellsValue.get(sheetName);
      if (rows[row - 1] == undefined) {
        rows[row - 1] = [];
      }
    }
  }

  private coordinatesToCellName (row: number, col: number): string {
    if (col < 1 || row < 1) {
      throw new Error("invalid cell coordinates [" + col + ", " + row + "]");
    }
    let colName = this.ColumnNumberToName(col);
    return colName + row;
  }

  private ColumnNumberToName (num: number): string {
    if (num < 1) {
      throw new Error("incorrect column number " + num);
    }
    if (num > Report.TotalColumns) {
      throw new Error("column number exceeds maximum limit");
    }
    let col = "";
    while (num > 0) {
      col = String.fromCharCode((num - 1) % 26 + 65) + col;
      num = Math.floor((num - 1) / 26);
    }
    return col;
  }

  public setCellTemplet (sheetName: string, row: number, col: number,
                         templetSheet: string, templetCellRow: number,
                         templetCellCol: number) {
    this.prepareSetCellConfig(sheetName, row, col);
    let cell = this.cells.get(sheetName)[row - 1][col - 1];
    cell[0] = templetSheet;
    cell[1] = this.coordinatesToCellName(templetCellRow, templetCellCol);
  }

  public setCellName (sheetName: string, row: number, col: number,
                      name: string) {
    this.prepareSetCellConfig(sheetName, row, col);
    let cell = this.cells.get(sheetName)[row - 1][col - 1];
    cell[2] = name;
  }

  public setCellMerge (sheetName: string, row: number, col: number,
                       mergeCellRow: number, mergeCellCol: number) {
    this.prepareSetCellConfig(sheetName, row, col);
    let cell = this.cells.get(sheetName)[row - 1][col - 1];
    cell[3] = this.coordinatesToCellName(mergeCellRow, mergeCellCol);
  }

  public setCellPicture (sheetName: string, row: number, col: number,
                         templetSheet: string, templetCellRow: number,
                         templetCellCol: number, x_offset: number,
                         y_offset: number) {
    this.prepareSetCellConfig(sheetName, row, col);
    let cell = this.cells.get(sheetName)[row - 1][col - 1];
    let picCell = this.coordinatesToCellName(templetCellRow, templetCellCol);
    const sep = Report.SeparatorValue;
    cell[4] = this.escapeString(templetSheet, sep) + sep +
      this.escapeString(picCell, sep) + sep + x_offset + sep + y_offset;
  }

  public setCellComment (sheetName: string, row: number, col: number,
                         comment: string) {
    this.prepareSetCellConfig(sheetName, row, col);
    let cell = this.cells.get(sheetName)[row - 1][col - 1];
    cell[5] = comment;
  }

  public setCellReplaceMode (sheetName: string, row: number, col: number,
                             replace: string | string[]) {
    this.prepareSetCellConfig(sheetName, row, col);
    let cell = this.cells.get(sheetName)[row - 1][col - 1];
    if (replace instanceof Array) {
      let res = "";
      replace.forEach((r, i, a) => {
        let isLastItem = i == a.length - 1;
        res += this.escapeString(r, "/", isLastItem);
        if (!isLastItem) {
          res += "/";
        }
      });
      cell[6] = res;
    } else {
      cell[6] = replace;
    }
  }

  /** 使用替换模式时，即使只有一个替换项也需要使用string[] */
  public setCellValueString (sheetName: string, row: number, col: number,
                             str: string | string[]) {
    this.prepareSetCellValue(sheetName, row);
    let res = "";
    if (str instanceof Array) {
      str.forEach((s, i, a) => {
        let isLastItem = i == a.length - 1;
        res += this.escapeString(s, "/", isLastItem);
        if (!isLastItem) {
          res += "/";
        }
      })
    } else {
      res = str;
    }
    this.cellsValue.get(sheetName)[row - 1][col - 1] =
      Report.CellValueTypeString + res;
  }

  public setCellValueBool (sheetName: string, row: number, col: number,
                           bool: boolean) {
    this.prepareSetCellValue(sheetName, row);
    this.cellsValue.get(sheetName)[row - 1][col - 1] =
      Report.CellValueTypeBool + bool;
  }

  public setCellValueNumber (sheetName: string, row: number, col: number,
                             number: number) {
    this.prepareSetCellValue(sheetName, row);
    this.cellsValue.get(sheetName)[row - 1][col - 1] =
      Report.CellValueTypeNumber + number;
  }

  public setCellValueDate (sheetName: string, row: number, col: number,
                           date: Date) {
    this.prepareSetCellValue(sheetName, row);
    this.cellsValue.get(sheetName)[row - 1][col - 1] =
      `${Report.CellValueTypeDate}${date.getFullYear()}-` +
      `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:` +
      `${date.getMinutes()}:${date.getSeconds()}`;
  }

  public setCellFormula (sheetName: string, row: number, col: number,
                         formula: string) {
    this.prepareSetCellValue(sheetName, row);
    this.cellsValue.get(sheetName)[row - 1][col - 1] =
      Report.CellValueTypeFormula + formula;
  }

  public setCellHyperlink (sheetName: string, row: number, col: number,
                           display: string, link: string) {
    this.prepareSetCellValue(sheetName, row);
    const sep = Report.SeparatorValue;
    this.cellsValue.get(sheetName)[row - 1][col - 1] =
      Report.CellValueTypeHyperLink + this.escapeString(display, sep) + sep +
      this.escapeString(link, sep, true);
  }

  public clearCellValue (sheetName: string, row: number, col: number) {
    this.prepareSetCellValue(sheetName, row);
    this.cellsValue.get(sheetName)[row - 1][col - 1] =
      Report.CellValueTypeClear;
  }

  private escapeString (str: string, character: string,
                        lastItem: boolean = false): string {
    for (let i = 0; i < str.length; ++i) {
      if (str[i] == character) {
        str = str.substr(0, i) + "\\" + str.substr(i);
        // str = str.substring(0, i + 1) + "\\" + str.substring(i);
        ++i;
      } else if (!lastItem && i == str.length - 1 && str[i] == "\\") {
        str = str + "\\";
        break;
      }
    }
    return str;
  }

  private getPrintStr_doc (): string {
    let str = "D@";
    let str_arr: string[] = [];
    if (this.doc[0] != undefined) str_arr.push("T" + this.doc[0]);
    if (this.doc[1] != undefined) str_arr.push("t" + this.doc[1]);
    if (this.doc[2] != undefined) str_arr.push("C" + this.doc[2]);
    if (this.doc[3] != undefined) str_arr.push("K" + this.doc[3]);
    if (this.doc[4] != undefined) str_arr.push("D" + this.doc[4]);
    if (this.doc[5] != undefined) str_arr.push("U" + this.doc[5]);
    if (this.doc[6] != undefined) str_arr.push("L" + this.doc[6]);
    if (this.doc[7] != undefined) str_arr.push("I" + this.doc[7]);
    if (this.doc[8] != undefined) str_arr.push("R" + this.doc[8]);
    if (this.doc[9] != undefined) str_arr.push("s" + this.doc[9]);
    if (this.doc[10] != undefined) str_arr.push("c" + this.doc[10]);
    if (this.doc[11] != undefined) str_arr.push("V" + this.doc[11]);
    if (this.doc[12] != undefined) str_arr.push("S" + this.doc[12]);
    for (let i = 0; i < str_arr.length; ++i) {
      let isLastItem = (i == str_arr.length - 1);
      str += this.escapeString(str_arr[i], Report.SeparatorInfo, isLastItem);
      if (!isLastItem) {
        str += Report.SeparatorInfo;
      }
    }
    return str;
  }

  private getPrintStr_Sheet (sheetConfig: string[]): string {
    let str = "S@";
    let str_arr: string[] = [];
    if (sheetConfig[0] != undefined) str_arr.push("N" + sheetConfig[0]);
    if (sheetConfig[1] != undefined) str_arr.push("T" + sheetConfig[1]);
    if (sheetConfig[2] != undefined) str_arr.push("H" + sheetConfig[2]);
    if (sheetConfig[3] != undefined) str_arr.push("P" + sheetConfig[3]);
    if (sheetConfig[4] != undefined) str_arr.push("p" + sheetConfig[4]);
    if (sheetConfig[5] != undefined) str_arr.push("D" + sheetConfig[5]);
    if (sheetConfig[6] != undefined) str_arr.push("C" + sheetConfig[6]);
    if (sheetConfig[7] != undefined) str_arr.push("W" + sheetConfig[7]);
    if (sheetConfig[8] != undefined) str_arr.push("h" + sheetConfig[8]);
    if (sheetConfig[9] != undefined) str_arr.push("f" + sheetConfig[9]);
    for (let i = 0; i < str_arr.length; ++i) {
      let isLastItem = (i == str_arr.length - 1);
      str += this.escapeString(str_arr[i], Report.SeparatorInfo, isLastItem);
      if (!isLastItem) {
        str += Report.SeparatorInfo;
      }
    }
    return str;
  }

  private getPrintStr_Row (rowsConfig: string[], cellsConfig: string[][],
                           cellsValue: string[]): string {
    let str = "R@";
    let rowsConfigStr = this.getPrintStr_RowsConfig(rowsConfig);
    str += this.escapeString(rowsConfigStr, Report.SeparatorItem) +
      Report.SeparatorItem;
    let cellsConfigStr = this.getPrintStr_CellsConfig(cellsConfig);
    str += this.escapeString(cellsConfigStr, Report.SeparatorItem) +
      Report.SeparatorItem;
    let cellsValueStr = this.getPrintStr_CellsValue(cellsValue);
    str += this.escapeString(cellsValueStr, Report.SeparatorItem, true);
    return str;
  }

  private getPrintStr_RowsConfig (rowsConfig: string[]): string {
    let str = "";
    let str_arr: string[] = [];
    if (rowsConfig[0] != undefined) str_arr.push("T" + rowsConfig[0]);
    if (rowsConfig[1] != undefined) str_arr.push("t" + rowsConfig[1]);
    if (rowsConfig[2] != undefined) str_arr.push("h" + rowsConfig[2]);
    if (rowsConfig[3] != undefined) str_arr.push("H" + rowsConfig[3]);
    if (rowsConfig[4] != undefined) str_arr.push("B" + rowsConfig[4]);
    if (rowsConfig[5] != undefined) str_arr.push("R" + rowsConfig[5]);
    for (let i = 0; i < str_arr.length; ++i) {
      let isLastItem = (i == str_arr.length - 1);
      str += this.escapeString(str_arr[i], Report.SeparatorInfo, isLastItem);
      if (!isLastItem) {
        str += Report.SeparatorInfo;
      }
    }
    return str;
  }

  private getPrintStr_CellsConfig (cellsConfig: string[][]): string {
    let str = "";
    let str_arr: string[] = [];
    for (let col = 0; col < cellsConfig.length; ++col) {
      let col_str = "";
      let col_str_arr: string[] = [];
      let config = cellsConfig[col];
      if (config == undefined) {
        str_arr.push('');
        continue;
      }
      if (config[0] != undefined) col_str_arr.push("T" + config[0]);
      if (config[1] != undefined) col_str_arr.push("t" + config[1]);
      if (config[2] != undefined) col_str_arr.push("N" + config[2]);
      if (config[3] != undefined) col_str_arr.push("M" + config[3]);
      if (config[4] != undefined) col_str_arr.push("P" + config[4]);
      if (config[5] != undefined) col_str_arr.push("C" + config[5]);
      if (config[6] != undefined) col_str_arr.push("R" + config[6]);
      for (let i = 0; i < col_str_arr.length; ++i) {
        let isLastItem = (i == col_str_arr.length - 1);
        col_str += this.escapeString(col_str_arr[i], Report.SeparatorInfo,
                                     isLastItem);
        if (!isLastItem) {
          col_str += Report.SeparatorInfo;
        }
      }
      str_arr.push(col_str);
    }
    for (let i = 0; i < str_arr.length; ++i) {
      let isLastItem = (i == str_arr.length - 1);
      str += this.escapeString(str_arr[i], Report.SeparatorCell, isLastItem);
      if (!isLastItem) {
        str += Report.SeparatorCell;
      }
    }
    return str;
  }

  private getPrintStr_CellsValue (cellsValue: string[]): string {
    let str = "";
    for (let i = 0; i < cellsValue.length; ++i) {
      let isLastItem = (i == cellsValue.length - 1);
      if (cellsValue[i] == undefined) {
        if (!isLastItem) {
          str += Report.SeparatorCell;
        }
      } else {
        str += this.escapeString(cellsValue[i], Report.SeparatorCell,
                                 isLastItem);
        if (!isLastItem) {
          str += Report.SeparatorCell;
        }
      }
    }
    return str;
  }
}

