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

