import * as CSV from 'csv-stringify/sync';
import { Data } from './get_data';

export function write2csv<D extends Data> (datas: D[]): string {
  let output = CSV.stringify(datas,
    {
      cast:
      {
        date: value => {
          if (value.getTime() === 0) { // TODO
            return '';
          }
          return '' + value.getFullYear() + '/' + (value.getMonth() + 1) + '/' + value.getDate();
        }
      }, header: true
    });
  return output;
}

