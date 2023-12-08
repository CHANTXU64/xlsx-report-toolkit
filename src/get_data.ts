import { parse as csv_parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';

export interface Table {
  name: string;
  data: Buffer;
}

/** data type support string, number, boolean, Date */
export interface Data {[id: string]: any};

type origRow = {[id: string]: string};

/** id为csv中column name, value 为对应在Data中的key */
export type Headers = {[id: string]: string};

export class GetData {
  public static getFromXlsx<D extends Data> (xlsx: Buffer,
                                             dataType: new() => D,
                                             headers?: Headers): D[] {
    let x = XLSX.read(xlsx);
    let csv = XLSX.utils.sheet_to_csv(x.Sheets[x.SheetNames[0]]);
    return this.getFromCsv(new Buffer(csv), dataType, headers);
  }

  public static getFromCsv<D extends Data> (csv: Buffer,
                                            dataType: new() => D,
                                            headers?: Headers): D[] {
    const origDatas: origRow[] = csv_parse(csv, {
                                          columns: true,
                                          skip_empty_lines: true,
                                          bom: true,
                                          // skip_records_with_empty_values: 
                                          skip_records_with_error: false
    });
    return this.transtoData(origDatas, dataType, headers);
  }

  public static splitTables (buffer: Buffer, delimiter: string): Table[] {
  const tables: Table[] = [];
  let startIdx = 0;

  while (true) {
    const delimiterIdx = buffer.indexOf(delimiter, startIdx);
    if (delimiterIdx === -1) break;

    const tableName = buffer.subarray(startIdx, delimiterIdx).toString("utf-8");
    const dataStartIdx = delimiterIdx + delimiter.length;
    const nextDelimiterIdx = buffer.indexOf(delimiter, dataStartIdx);
    const dataEndIdx =
      nextDelimiterIdx === -1 ? buffer.length : nextDelimiterIdx;

    tables.push({
      name: tableName,
      data: buffer.subarray(dataStartIdx, dataEndIdx),
    });

    startIdx = dataEndIdx + delimiter.length;
  }

  return tables;
}

  public static splitTables2 (buffer: Buffer, delimiter: string): Table[] {
    let tables: Table[] = [];
    let curTable: Table | null = null;
    let startIdx = 0;

    for (let i = 0; i < buffer.length; i++) {
      if (buffer.toString("utf-8", i, i + delimiter.length) === delimiter) {
        if (curTable !== null) {
          // 当前表格结束
          curTable.data = buffer.subarray(startIdx, i);
          tables.push(curTable);
        }

        // 新表格开始
        const tableName = buffer
        .toString("utf-8", startIdx, i)
        .replace(/\r?\n|\r/g, "");
        curTable = { name: tableName, data: Buffer.alloc(0) };
        startIdx = i + delimiter.length;
      }
    }

    if (curTable !== null) {
      // 最后一个表格
      curTable.data = buffer.subarray(startIdx);
      tables.push(curTable);
    }

    return tables;
  }

  private static transtoData<D extends Data> (origDatas: origRow[],
                                              dataType: new() => D,
                                              headers?: Headers): D[] {
    let datas: D[] = [];
    origDatas.forEach(row => {
      let d = new dataType();
      for (const col_name in row) {
        let key: (keyof D) = col_name;
        if (headers != undefined && headers.hasOwnProperty(col_name)) {
          key = headers[col_name];
        }
        if (d.hasOwnProperty(key)) {
          let value: any = row[col_name];
          d[key] = this.autoTransType(d[key], value);
        }
      }
      datas.push(d);
    });
    return datas;
  }

  private static autoTransType (defaultValue: any, value: string): any {
    switch (typeof defaultValue) {
      case "number":
        return Number(value);
      case "boolean":
        return value === "true" || value === "1" || value === "True";
      case "object":
        if (defaultValue instanceof Date) {
          if (value === "") {
            return new Date(0); // TODO
          } else {
            let res = new Date(value);
            if (isNaN(res.getTime())) {
              res = new Date("2000-01-01 " + value); // Time
              if (isNaN(res.getTime())) {
                return res; // TODO
              } else {
                return res;
              }
            } else {
              return res;
            }
          }
        }
    }
    return value;
  }
}

// class TestData implements Data {
//   public id: string = "";
//   public number: string = "";
//   public dw: string = "";
//   public amount: number = -1;
//   public method: string = "";
//   public date: Date = new Date();
//   public 时间: Date = new Date();
// }

// function test () {
//   const test_csv_file = "./test_csv.csv";
//   const csv = fs.readFileSync(test_csv_file);
//   // console.log(GetData.getFromCsv(csv, TestData));
//   const test_csvlz4_file = "./test_csv.lz4";
//   const lz4 = fs.readFileSync(test_csvlz4_file);
//   console.log(GetData.getFromCsvLz4(lz4, TestData));
// }

// test();

