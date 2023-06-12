import { Data } from './get_data';
import { BigNum as N}  from './number';

/**
 * pagingFunc data表示origData中某一data，pageData表示最后一页data，
 * index表示该data在origData中的index
 * @param pageSize 该page中能容纳data的数量
 */
export function pagingData<T> (origData: T[],
                               pagingFunc: (data: T, pageData: T[], index: number) => boolean,
                               pageSize: number): T[][] {
  let pagesData: T[][] = [];
  origData.forEach((d, index) => {
    if (pagesData.length == 0) {
      pagesData.push([d]);
    } else {
      let lastPage = pagesData[pagesData.length - 1];
      if (lastPage.length < pageSize &&
          pagingFunc(d, lastPage.slice(), index)) {
        lastPage.push(d);
      } else {
        pagesData.push([d]);
      }
    }
  });
  return pagesData;
}

export function classifyData<T> (origData: T[],
          classifyFunc: (data: T, classData: T[], index: number) => boolean,
            stopIfSort = true): T[][] {
  let classifyData: T[][] = [];
  origData.forEach((d, index) => {
    if (classifyData.length == 0) {
      classifyData.push([d]);
    } else {
      let flag = false;
      for (let i = 0; i < classifyData.length; ++i) {
        if (classifyFunc(d, classifyData[i], index)) {
          classifyData[i].push(d);
          flag = true;
          if (!stopIfSort) {
            break;
          }
        }
      }
      if (!flag) {
        classifyData.push([d]);
      }
    }
  });
  return classifyData;
}

export function deleteEmptyArr<T> (arr_arr: T[][]) {
  for (let i = 0; i < arr_arr.length; ++i) {
    if (arr_arr[i] == undefined || arr_arr[i].length == 0) {
      arr_arr.splice(i, 1);
      --i;
    }
  }
}

/** 仅能合并number、string类型 */
export function mergeData<T extends Data> (datas: T[],
                           flagKeys: Array<{key: keyof T,
                                            ignoreSpace: boolean}>,
                           mergeKey: Array<keyof T>): T[] {
  let res: T[] = [];
  for (let i = 0; i < datas.length; ++i) {
    let flag = false;
    for (let ii = 0; ii < res.length && !flag; ++ii) {
      flag = merge2Data(res[ii], datas[i], flagKeys, mergeKey);
    }
    if (flag == false) {
      res.push(datas[i]);
    }
  }
  return res;
}

/** 仅能合并number、string类型 */
function merge2Data<T extends Data> (targetData: T, sourceData: T,
                     flagKeys: Array<{key: keyof T,
                                      ignoreSpace: boolean}>,
                     mergeKey: Array<keyof T>): boolean {
  let flag = true;
  for (let i = 0; i < flagKeys.length; ++i) {
    let key = flagKeys[i].key;
    if (!targetData.hasOwnProperty(key) ||
        !sourceData.hasOwnProperty(key)) {
      continue;
    }
    if (flagKeys[i].ignoreSpace) {
      let source_key_value = ("" + sourceData[key]).replace(/[\s\n\r]/g, '');
      let target_key_value = ("" + targetData[key]).replace(/[\s\n\r]/g, '');
      if (source_key_value != target_key_value) {
        flag = false;
        break;
      }
    } else {
      let value: any = sourceData[key];
      if (value instanceof Date) {
        let b: any = targetData[key];
        if (value.toISOString() != b.toISOString()) {
          flag = false;
          break;
        }
      } else if (sourceData[key] != targetData[key]) {
        flag = false;
        break;
      }
    }
  }
  if (flag) {
    let td = targetData;
    let sd = sourceData;
    for (let i = 0; i < mergeKey.length; ++i) {
      let k = mergeKey[i];
      if (td.hasOwnProperty(k) && sd.hasOwnProperty(k)) {
        if (typeof td[k] == "number") {
          let a: any = td[k];
          let b: any = sd[k];
          let r: any = N.plus(a, b);
          td[k] = r;
        } else if (typeof targetData[k] == "string") {
          let a: any = td[k];
          let b: any = sd[k];
          let r: any = mergeString(a, b);
          td[k] = r;
        } else {
          continue; // TODO
        }
      } else if (td.hasOwnProperty(k) && !sd.hasOwnProperty(k)) {
        continue;
      } else if (!td.hasOwnProperty(k) && sd.hasOwnProperty(k)){
        td[k] = sd[k];
      } else {
        continue;
      }
    }
  }
  return flag;
}

function mergeString (string_1: string, string_2: string) {
  let delimiter = "、";
  let splitted_1 = string_1.split(delimiter);
  let splitted_2 = string_2.split(delimiter);
  let splitted_merge = [];
  for (let i = 0; i < splitted_1.length; ++i) {
    if (splitted_merge.indexOf(splitted_1[i]) == -1) {
      splitted_merge.push(splitted_1[i]);
    }
  }
  for (let i = 0; i < splitted_2.length; ++i) {
    if (splitted_merge.indexOf(splitted_2[i]) == -1) {
      splitted_merge.push(splitted_2[i]);
    }
  }
  let string_merge = "";
  for (let i = 0; i < splitted_merge.length; ++i) {
    string_merge += splitted_merge[i] + "、";
  }
  string_merge = string_merge.slice(0, -1);
  if (string_merge[0] == "、") {
    string_merge = string_merge.slice(1);
  }
  return string_merge;
}

