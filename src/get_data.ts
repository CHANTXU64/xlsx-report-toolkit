import * as lz4 from 'lz4';
import { parse as csv_parse } from 'csv-parse/sync';

/** data type support string, number, boolean, Date */
export interface Data {[id: string]: any};

type origRow = {[id: string]: string};

/** id为csv中column name, value 为对应在Data中的key */
export type Headers = {[id: string]: string};

export class GetData {
  public static getFromCsv<D extends Data> (csv: Buffer,
                                            dataType: new() => D,
                                            headers?: Headers): D[] {
    const origDatas: origRow[] = csv_parse(csv, {
                                          columns: true,
                                          skip_empty_lines: true,
                                          // skip_records_with_empty_values: 
                                          skip_records_with_error: false
    });
    return this.transtoData(origDatas, dataType, headers);
  }

  public static getFromCsvLz4<D extends Data> (compress_csv: Buffer,
                                               dataType: new() => D,
                                               headers?: Headers): D[] {
    let csv = lz4.decode(compress_csv);
    return this.getFromCsv(csv, dataType, headers);
  }

  private static transtoData<D extends Data> (origDatas: origRow[],
                                              dataType: new() => D,
                                              headers?: Headers): D[] {
    let datas: D[] = [];
    origDatas.forEach(row => {
      let d = new dataType();
      for (const column_name in row) {
        let key: (keyof D) = column_name;
        if (headers != undefined && headers.hasOwnProperty(column_name)) {
          key = headers[column_name];
        }
        if (d.hasOwnProperty(key)) {
          let value: any = row[column_name];
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
          return new Date(value);
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

