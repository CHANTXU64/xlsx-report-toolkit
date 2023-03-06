import { BigNum as N } from './number';

class Row {
  private _height: number;
  private _tmpltRowNumber: number;
  private _hgtAdj: number = 0;

  /** original height */
  public get height (): number {return this._height}
  /** height adjust value, negative value means reduce height */
  public get hgtAdj (): number {return this._hgtAdj}
  /** templet row number */
  public get tmpltRowNumber (): number {return this._tmpltRowNumber}

  constructor (height: number, tmpltRowNumber: number) {
    this._height = height;
    this._tmpltRowNumber = tmpltRowNumber;
  }

  public cusHgt (newHeight: number) {
    this._height = newHeight;
  }

  public setAdjHgt (hgtAdj: number) {
    this._hgtAdj = hgtAdj;
  }

  public clone (): Row {
    let newRow = new Row(this._height, this._tmpltRowNumber);
    newRow.setAdjHgt(this._hgtAdj);
    return newRow;
  }
}

export enum ElemType {
  firstTitle,
  otherTitle,
  tokenTitle,
  data,
  tokenEmpty,
  tokenPageEnd,
  tokenEnd,
  otherEnd,
  lastEnd,
  empty
}

export class Elem {
  protected static readonly rowHgtAdjAccDefault: number = 0.25;
  protected _rows: Row[] = [];
  protected _heightAdjOrd: number;
  protected _height: number = 0;
  protected _hgtAdjMaxRdc: number = -1;
  protected _hgtAdjMaxInc: number = -1;
  protected _hgtAdjAcc: number;
  protected _hgtAdjMaxTimeRdc: number = -1;
  protected _hgtAdjMaxTimeInc: number = -1;
  protected _adjHgt: number = 0;
  protected _name: string;
  protected _type: ElemType;
  protected _cusHgt: boolean = false;
  protected _tokenPageEnd: Elem | undefined;

  /** heightAdjOrd 默认以type准: empty与data为0, 其余为-1, 越大越先调整
   *  默认adjust max为[0, 0], 第一个为reduce, 第二个为increase
   *  name 用于外部识别Elem, 默认为""
   */
  constructor (type: ElemType, tmpltRowStart: number, tmpltRowEnd: number,
               heights: number[], hgtAdjMax: [number, number] = [0, 0],
               heightAdjOrd?: number, name?: string) {
    if (name != undefined) {
      this._name = name;
    } else {
      this._name = "";
    }
    this._type = type;
    if (heightAdjOrd != undefined) {
      this._heightAdjOrd = heightAdjOrd;
    } else if (type == ElemType.empty || type == ElemType.data) {
      this._heightAdjOrd = 0;
    } else {
      this._heightAdjOrd = -1;
    }
    for (let rnum = tmpltRowStart; rnum < tmpltRowEnd; ++rnum) {
      this._rows.push(new Row(heights[rnum - tmpltRowStart], rnum));
      this._height = N.plus(this._height, heights[rnum - tmpltRowStart]);
    }
    this._hgtAdjAcc = N.times(this._rows.length, Elem.rowHgtAdjAccDefault);
    this.setElemAdjMaxAndTimes(hgtAdjMax);
  }

  /** 该元素的名称，用于根据draw结果编制excel */
  public get name (): string {return this._name};
  /** 各元素高度调整顺序, 越大越先调整 */
  public get heightAdjOrd (): number {return this._heightAdjOrd};
  public get rows (): Row[] {return this._rows.map(row => row.clone())};
  /** 该元素的高度 */
  public get height (): number {return this._height};
  public get type (): ElemType {return this._type};
  public get hgtAdjMaxRdc (): number {return this._hgtAdjMaxRdc};
  public get hgtAdjMaxInc (): number {return this._hgtAdjMaxInc};
  public get hgtAdjAcc (): number {return this._hgtAdjAcc};
  public get adjMaxTimesRdc (): number {
    if (this._hgtAdjAcc == 0) {
      return 0;
    }
    return Math.floor(N.div(this._hgtAdjMaxRdc, this._hgtAdjAcc));
  }
  public get adjMaxTimesInc (): number {
    if (this._hgtAdjAcc == 0) {
      return 0;
    }
    return Math.floor(N.div(this._hgtAdjMaxInc, this._hgtAdjAcc));
  }

  /** 设置自定义高度 */
  public setCusHgt (cusHgt: number): void {
    if (!this._cusHgt) {
      let adjustHgt = N.minus(this._height, cusHgt);
      this._height = cusHgt;
      let row_avg_adjHgt = Math.floor(N.div(adjustHgt, this._rows.length));
      cusHgt = N.minus(cusHgt, N.times(row_avg_adjHgt, this._rows.length));
      this._rows.forEach(r => {
        let a = 0;
        if (cusHgt >= 1) {
          a = 1;
        } else {
          a = cusHgt;
        }
        cusHgt = N.minus(cusHgt, a);
        r.cusHgt(N.minus(r.height, row_avg_adjHgt, a));
      });
      this._cusHgt = true;
    } else {
      throw new Error("Set CusHgt twice!");
    }
  }

  /** 调整高度，-1表示减少一次高度，+1表示增加一次高度，0表示adjHgt恢复至0，
   *  不传入参数不做任何改变。
   *  不会改变height值，返回总调整值，不会超过调整上限 */
  public adjHgt (adj?: number): number {
    if (adj != undefined) {
      if (adj == 0) {
        this._adjHgt = 0;
        this._rows.forEach(row => row.setAdjHgt(0));
      } else {
        let resAdj = N.plus(this._adjHgt, N.times(adj, this._hgtAdjAcc));
        if (resAdj >= -1 * this._hgtAdjMaxRdc && resAdj <= this._hgtAdjMaxInc){
          this._adjHgt = resAdj;
          this._rows.forEach(row =>
             row.setAdjHgt(N.plus(row.hgtAdj,
                                  N.times(adj,
                                          Elem.rowHgtAdjAccDefault))));
        }
      }
    }
    return this._adjHgt;
  }

  public clone (): Elem {
    let tmpltRowStart = 0;
    let tmpltRowEnd = 0;
    if (this._rows.length > 0) {
      tmpltRowStart = this._rows[0].tmpltRowNumber;
      tmpltRowEnd = this._rows[this._rows.length - 1].tmpltRowNumber + 1;
    }
    let height = this._rows.map(row => row.height);
    let newElem = new Elem(this._type, tmpltRowStart, tmpltRowEnd, height,
                           [this._hgtAdjMaxRdc, this._hgtAdjMaxInc],
                           this.heightAdjOrd, this.name);
    let adj = N.div(this._adjHgt, this._hgtAdjAcc);
    newElem.adjHgt(adj);
    let tokenPageEnd = this.getTokenPageEnd();
    if (tokenPageEnd != undefined) {
      newElem.setTokenPageEnd(tokenPageEnd);
    }
    return newElem;
  }

  protected setElemAdjMaxAndTimes (hgtAdjMax: [number, number]) {
    let elemRdcMaxAndTimes = this.calcElemAdjMaxAndTimes(hgtAdjMax[0]);
    this._hgtAdjMaxRdc = elemRdcMaxAndTimes[0];
    this._hgtAdjMaxTimeRdc = elemRdcMaxAndTimes[1];
    let elemIncMaxAndTimes = this.calcElemAdjMaxAndTimes(hgtAdjMax[1]);
    this._hgtAdjMaxInc = elemIncMaxAndTimes[0];
    this._hgtAdjMaxTimeInc = elemIncMaxAndTimes[1];
  }

  protected calcElemAdjMaxAndTimes (elemAdjMax: number): [number, number] {
    let rowAdjAcc = Elem.rowHgtAdjAccDefault;
    if (this._rows.length <= 0) {
      return [0, 0];
    }
    let adjTimes = Math.floor(N.div(elemAdjMax, this._rows.length, rowAdjAcc));
    return [N.times(adjTimes, rowAdjAcc, this._rows.length), adjTimes];
  }

  /** 用于Layout.draw()在调整页面时需要快速获取data的tokenPageEnd */
  public setTokenPageEnd (tokenPageEnd: Elem) {
    this._tokenPageEnd = tokenPageEnd;
  }

  /** 用于Layout.draw()在调整页面时需要快速获取data的tokenPageEnd */
  public getTokenPageEnd (): Elem {
    if (this._tokenPageEnd == undefined) {
      throw new Error ("getTokenPageEnd error: no tokenPageEnd");
    }
    return this._tokenPageEnd;
  }
}

export type Page = Elem[];

export class DataToken {
  protected _title: Elem;
  protected _data: Elem | DataToken[];
  protected _empty: Elem = new Elem(ElemType.empty, 0, 0, []);
  protected _pageEnd: Elem;
  protected _end: Elem;
  protected _emptyVisible: boolean = true;
  protected _array: boolean = false;
  protected _startWithNewPage: boolean = false;

  public get title (): Elem {return this._title};
  public get data (): Elem | DataToken[] {return this._data};
  public get empty (): Elem {return this._empty};
  public get pageEnd (): Elem {return this._pageEnd};
  public get end (): Elem {return this._end};
  /** data为空时该token是否可见 */
  public get emptyVisible (): boolean {return this._emptyVisible};
  /** 使用该config生成多个相同样式的Token,使用[]包裹 */
  public get array (): boolean {return this._array};
  /** token是否要邻接上一个token，还是从新的一页开始 TODO */
  public get startWithNewPage (): boolean {return this._startWithNewPage};

  /** emptyVisible: data为空时该token是否可见, true
   *  array: 使用该config生成多个相同样式的Token,使用[]包裹, false
   *  startWithNewPage: token是否要邻接上一个token，还是从新的一页开始, false
   *  empty: token empty, startWithNewPage 才用得到的Elem
   *  */
  constructor (title: Elem, data: Elem | DataToken[], pageEnd: Elem,
               end: Elem, emptyVisible: boolean = true, array: boolean = false,
               startWithNewPage: boolean = false, empty?: Elem) {
    if (title.type != ElemType.tokenTitle ||
        (data instanceof Elem && data.type != ElemType.data) ||
        pageEnd.type != ElemType.tokenPageEnd ||
        end.type != ElemType.tokenEnd) {
      throw new Error("Token constructor error #01");
    }
    this._title = title.clone();
    this._pageEnd = pageEnd.clone();
    if (data instanceof Elem) {
      this._data = data.clone();
    } else {
      this._data = data.map(d => d.clone());
    }
    this._end = end.clone();
    this._emptyVisible = emptyVisible;
    this._array = array;
    this._startWithNewPage = startWithNewPage;
    if (startWithNewPage) {
      if (empty == undefined || empty.type != ElemType.tokenEmpty) {
        throw new Error("Token constructor error #02");
      }
      this._empty = empty.clone();
    }
  }

  public clone (): DataToken {
    let newToken = new DataToken(this._title, this._data, this._pageEnd,
                                   this._end, this._emptyVisible, this._array);
    return newToken;
  }
}

export type Config = {
  pageHgtStd: number;
  pageHgtMax: number;
  firstTitle: Elem;
  otherTitle: Elem;
  data: DataToken[];
  empty: Elem;
  otherEnd: Elem;
  lastEnd: Elem;
}

interface DeepArray<T> extends Array<T | DeepArray<T>> {};

/** 每个Array表示该类Elem有多少行,length表示行数,每个元素表示该行的自定义高度 */
export class DataHgt {
  protected _dataHgtsDeep: DeepArray<Array<number>> = [];
  protected _dataHgts: Array<number> = [];
  protected _isNotDeep: boolean = false;

  constructor (dataHgt: Array<number> | DeepArray<Array<number>>) {
    if (dataHgt.length > 0) {
      let a = dataHgt[0];
      let h: any = dataHgt;
      if (typeof a == "number") {
        this._isNotDeep = true;
        this._dataHgts = h.slice();
      } else {
        this._dataHgtsDeep = h.slice();
      }
    }
  }

  public empty (): boolean {
    if (this._isNotDeep) {
      return this._dataHgts.length <= 0;
    }
    return this._dataHgtsDeep.length <= 0;
  }

  public length (): number {
    if (this._isNotDeep) {
      return this._dataHgts.length;
    }
    return this._dataHgtsDeep.length;
  }

  /** 为空时无法分辨 */
  public isNotDeep (): boolean {
    return this._isNotDeep;
  }
 
  /** only deep */
  public index (i: number): DataHgt {
    return new DataHgt(this._dataHgtsDeep[i])
  }

  /** only not deep */
  public getHgts (): Array<number> {
    return this._dataHgts.slice();
  }
}

export class Layout {
  protected _config: Config;
  protected _confElemNames: string[] = [];

  constructor (config: Config) {
    this._config = config;
  }

  public draw (dataHgt: DataHgt): Page {
    if (!this.isDataMatchConf(dataHgt, this._config.data)) {
      throw new Error("Data height match failed!");
    }

    // page 中已经包含token title，token data，token end及last end
    let page = this.initPage(this._config.data, dataHgt);
    page.push(this._config.lastEnd.clone());

    // 记录page中每页开头位置
    let pageIdx: number[] = [];
    let idxS, idxE = 0;

    while (idxE < page.length) {
      idxS = idxE;
      pageIdx.push(idxS);
      this.insertTitle(idxS, page); // firstTitle or otherTitle
      idxE = this.moveIdxEndUntilPageBottom(page, idxS);
      // 由于需要调整页面, lastEnd不确定是否在该页面中（可能被调整到下一页）,
      // 添加 otherEnd 在adjustCurPage中完成
      // adjustCurPage 还负责添加empty, tokenPageEnd
      idxE = this.adjustThisPage(page, idxS, idxE, pageIdx);
    }

    return page;
  }

  /** 返回token title, data, token end
   *  同时设置data elem的tokenPageEnd */
  protected initPage (conf: DataToken[], dataHgt: DataHgt): Page {
    let page: Page = [];
    conf.forEach((c, i) => {
      this.pushDataToken(page, c, dataHgt.index(i));
    });
    return page;
  }

  /** return no elem */
  protected pushDataElem (page: Page, elemConfig: Elem, tokenPageEnd: Elem,
                          dataHgt: DataHgt): boolean {
    if (dataHgt.isNotDeep()) {
      let heights = dataHgt.getHgts();
      for (let i = 0; i < heights.length; ++i) {
        let elem = elemConfig.clone();
        elem.setTokenPageEnd(tokenPageEnd);
        page.push(elem);
        if (heights[i] >= 0) { // 使用自定义高度
          page[page.length - 1].setCusHgt(heights[i]);
        }
      }
    } else {throw new Error("Push data elem failed, data match failed! #01");}
    return dataHgt.empty();
  }

  /** return this token is empty */
  protected pushDataToken (page: Page, tokenConfig: DataToken,
                           dataHgt: DataHgt): boolean {
    let thisTkPage: Page = [];
    let empty: boolean = true;
    thisTkPage.push(tokenConfig.title.clone());
    if (!dataHgt.isNotDeep()) {
      if (tokenConfig.array) { // data 为[(Elem, ConfigDataToken..)[]]之类
        for (let i = 0; i < dataHgt.length(); ++i) {
          empty = this.pushDataTokenMain(thisTkPage, tokenConfig,
                                         dataHgt.index(i)) && empty;
        }
      } else { // data 为[Elem, ConfigDataToken..]之类
        empty = this.pushDataTokenMain(thisTkPage, tokenConfig,
                                       dataHgt) && empty;
      }
    } else if (tokenConfig.data instanceof Elem) { // data为Elem
      empty = this.pushDataElem(thisTkPage, tokenConfig.data,
                                tokenConfig.pageEnd, dataHgt) && empty;
    } else {throw new Error("Push data token failed, data match failed! #02");}
    thisTkPage.push(tokenConfig.end.clone());
    if (tokenConfig.emptyVisible || !empty) {
      page.push(...thisTkPage);
    }
    return empty;
  }

  /** return this data empty */
  protected pushDataTokenMain (page: Page, config: DataToken,
                               dataHgt: DataHgt): boolean {
    let empty = true;
    if (config.data instanceof Elem) {
      empty = this.pushDataElem(page, config.data, config.pageEnd, dataHgt);
    } else {
      for (let i = 0; i < config.data.length; ++i) {
        empty = this.pushDataToken(page, config.data[i],
                                   dataHgt.index(i)) && empty;
      }
    }
    return empty;
  }

  /** data 匹配layout config格式 */
  protected isDataMatchConf (dataHgt: DataHgt,
                             dataConf: Elem | DataToken[]): boolean {
    if (dataConf instanceof Elem) {
      console.error("Data match failed, data is Elem, but config is deep!");
      return dataHgt.isNotDeep();
    }
    if (dataHgt.isNotDeep() || dataHgt.length() != dataConf.length) {
      console.error("Data match failed, data length not match!");
      console.error("dataHgt: ", dataHgt);
      console.error("dataConf: ", dataConf);
      return false;
    }
    for (let i = 0; i < dataConf.length; ++i) {
      let c = dataConf[i];
      let d = dataHgt.index(i);
      if (d.isNotDeep()) {
        return c.data instanceof Elem;
      } else {
        if (c.array == false) {
          if (this.isDataMatchConf(d, c.data) == false) {
            return false
          }
        } else { // config data 为多个相同的Token
          for (let ii = 0; ii < d.length(); ++ii) {
            let dd = d.index(ii);
            if (dd.isNotDeep()) {
              return c.data instanceof Elem;
            } else {
              if (this.isDataMatchConf(dd, c.data) == false) {
                return false;
              }
            }
          }
        }
      }
    }
    return true;
  }

  protected insertTitle (idxS: number, page: Page) {
    if (idxS == 0) {
      page.splice(idxS, 0, this._config.firstTitle.clone());
    } else {
      page.splice(idxS, 0, this._config.otherTitle.clone());
    }
  }

  protected moveIdxEndUntilPageBottom (page: readonly Elem[],
                                       idxS: number): number {
    let idx = idxS;
    let otherEnd = this._config.otherEnd;
    let hgtStd = this._config.pageHgtStd;
    let hgtMax = this._config.pageHgtMax;
    while (idx < page.length) {
      let curSinglePage = page.slice(idxS, idx);
      let nextElems1: Elem[] = [];
      let nextElems2: Elem[] = [page[idx]];
      if (page[idx].type != ElemType.lastEnd) {
        // 在这里不使用clone是因为该函数并不改变page, push otherEnd仅仅是测量用
        nextElems1.push(otherEnd);
        nextElems2.push(otherEnd);
      }
      if (this.appendCloseToStdUnderMax(curSinglePage, nextElems1, nextElems2,
                                        hgtStd, hgtMax)) {
        ++idx;
      } else {
        break;
      }
    }
    return idx;
  }

  protected getElemsHeight (elems: readonly Elem[], idxS: number,
                           idxE: number): number {
    let height = 0;
    for (let i = idxS; i < idxE; ++i) {
      height = N.plus(height, elems[i].height, elems[i].adjHgt());
    }
    return height;
  }

  /**
   * 判断目前页面高度与加上下一个元素的页面高度哪一个更接近heightStd
   * @return { boolean } false 表示目前页面高度更接近，true 反之
   */
  protected closeToStd (curHeight: number, nextElemHgt: number,
                        heightStd: number, heightMax: number): boolean {
    if (curHeight <= heightMax && N.plus(curHeight, nextElemHgt) > heightMax) {
      return false;
    }
    let curDist = this.dist(curHeight, heightStd);
    let nextDist = this.dist(N.plus(curHeight, nextElemHgt), heightStd);
    return curDist > nextDist;
  }

  /**
   * 判断目前页面与加上下n个元素的高度在最少调整下哪一个更接近std, 且不超过max
   * @returns { boolean }
   * false表示目前页面高度更接近,
   * true表示加上下n个元素更接近heightStd, 或加不加下n个元素相同
   */
  protected appendCloseToStdUnderMax (curSinglePage: readonly Elem[],
                                      nextElems1: readonly Elem[],
                                      nextElems2: readonly Elem[],
                                      hgtStd: number,
                                      hgtMax: number): boolean {
    let tar2SinglePage = curSinglePage.slice();
    tar2SinglePage.push(...nextElems2);
    if (!this.adjHgtCanBeBelowMax(tar2SinglePage, hgtMax)) { // TODO
      return false;
    }
    let tar1SinglePage = curSinglePage.slice();
    tar1SinglePage.push(...nextElems1);
    let tar1AdjTimesAndDist = this.autoAdjHgt(tar1SinglePage, hgtStd, hgtMax);
    let tar2AdjTimesAndDist = this.autoAdjHgt(tar2SinglePage, hgtStd, hgtMax);
    if (tar1AdjTimesAndDist[1] != tar2AdjTimesAndDist[1]) {
      // 至少一种页面无法达到std, 哪个距离更小更好
      return tar1AdjTimesAndDist[1] >= tar2AdjTimesAndDist[1];
    }
    return this.calcAdjRltvScore(tar1SinglePage, tar1AdjTimesAndDist[0], hgtStd) <=
      this.calcAdjRltvScore(tar2SinglePage, tar2AdjTimesAndDist[0], hgtStd);
  }

  /**
   * 判断目前页面与减去最后n个元素的高度在最少调整下哪一个更接近std
   * 默认减去1个元素
   * @returns { boolean }
   * false表示目前页面高度更接近, 或减不减去最后n个元素相同
   * true表示减去最后n个元素更接近heightStd
   */
  protected popCloseToStd (curSinglePage: readonly Elem[],
                           hgtStd: number,
                           hgtMax: number,
                           elemNumber: number = 1): boolean {
    if (!this.adjHgtCanBeBelowMax(curSinglePage, hgtMax)) {
      return true;
    }
    let tarSinglePage = curSinglePage.slice(0, -1 * elemNumber);
    let curAdjTimesAndDist = this.autoAdjHgt(curSinglePage, hgtStd, hgtMax);
    let tarAdjTimesAndDist = this.autoAdjHgt(tarSinglePage, hgtStd, hgtMax);
    if (curAdjTimesAndDist[1] != tarAdjTimesAndDist[1]) {
      return curAdjTimesAndDist[1] > tarAdjTimesAndDist[1];
    }
    return this.calcAdjRltvScore(curSinglePage, curAdjTimesAndDist[0], hgtStd)<
      this.calcAdjRltvScore(tarSinglePage, tarAdjTimesAndDist[0], hgtStd);
  }

  /**
   * 判断目前页面替换元素后的高度在最少调整下替换n个元素更接近std
   * @returns { number }
   * 返回替换n个元素更接近heightStd, n<0表示不应该替换
   */
  protected replaceNElemCloseToStd (curSinglePage: readonly Elem[],
                                    hgtStd: number, hgtMax: number,
                                    replaceElems: readonly Elem[],
                                    maxBeRplacedNumber: number): number {
    let p = curSinglePage.slice(0, -1 * maxBeRplacedNumber);
    p.push(...replaceElems);
    if (!this.adjHgtCanBeBelowMax(p, hgtMax)) {
      return -1;
    }
    let minAdjTimesAndDist: [number[], number, number] =
      [...this.autoAdjHgt(curSinglePage, hgtStd, hgtMax), 0];
    let minSinglePage = curSinglePage.slice();
    let lastDist = Number.MAX_VALUE;
    for (let i = 1; i <= maxBeRplacedNumber; ++i) {
      let tarSinglePage = curSinglePage.slice(0, -1 * i);
      tarSinglePage.push(...replaceElems);
      let tarAdjTimesAndDist = this.autoAdjHgt(tarSinglePage, hgtStd, hgtMax);
      if (tarAdjTimesAndDist[1] > lastDist) {
        break; // 随着替换的更多，距离越来越大，就可以停止了
      }
      lastDist = tarAdjTimesAndDist[1];
      if (tarAdjTimesAndDist[1] < minAdjTimesAndDist[1] ||
          (tarAdjTimesAndDist[1] == minAdjTimesAndDist[1] &&
           this.calcAdjRltvScore(tarSinglePage,tarAdjTimesAndDist[0],hgtStd) >=
           this.calcAdjRltvScore(minSinglePage,minAdjTimesAndDist[0],hgtStd))){
        minSinglePage = tarSinglePage.slice();
        minAdjTimesAndDist = [...tarAdjTimesAndDist, i];
      }
    }
    return minAdjTimesAndDist[2];
  }

  /**
   * 判断目前页面与替换n个元素的高度在最少调整下哪一个更接近std
   * @returns { boolean }
   * false表示目前页面高度更接近
   * true表示替换n个元素更接近heightStd, 或替补替换相同
   */
  protected replaceCloseToStd (curSinglePage: readonly Elem[],
                               hgtStd: number, hgtMax: number,
                               replaceElems: readonly Elem[],
                               replaceNumber: number): boolean {
    // TODO
    throw new Error("Layout TODO LAZY");
  }

  /**
   * 为了比较调整好坏，计算高度调整分数。单个元素调整后变化**看起来**越少越好，
   * 原本行高为100的元素A调整10与原本行高为10的元素B调整10更好
   * @returns { number } 调整分数，调整越少分数越高
   */
  protected calcAdjRltvScore (singlePage: readonly Elem[],
                              adjTimes: number[], heightStd: number): number {
    let score = 0;
    singlePage.forEach((e, i) => {
      let adjTime = Math.abs(adjTimes[i]);
      let adjValue = N.times(e.hgtAdjAcc, adjTime);
      if (e.height != 0) {
        score = N.plus(score, N.div(adjValue, e.height), adjValue);
      }
    });
    return -1 * N.div(score, heightStd);
  }

  protected dist (current: number, target: number): number {
    return Math.abs(N.minus(current, target));
  }

  /** 负责调整页面，添加empty、tokenPageEnd、otherEnd
   * page包含firstTitle, otherTitle, tokenTitle, data, tokenEnd, lastEnd
   */
  protected adjustThisPage (page: Page, idxS: number,
                            idxE: number, pageIdx: number[]): number {
    let config = this._config;
    // 通过当前页面最后一行是什么元素来调整页面
    switch (page[idxE - 1].type) {

      // 不允许token title 在页面最后一行，通过增加该页面行高把title放到下一页
      // TODO
      case ElemType.tokenTitle:
        page.splice(idxE - 1, 0, config.otherEnd.clone());
        break;

      // 不允许页面最后一行为data，需要添加token page end作为页面end
      case ElemType.data:
        idxE = this.replacePageEndDatas(page, idxS, idxE);
        break;

      // 不能在空白页结尾，将最后一个data放到下一个页面或减小高度插入后续elem
      case ElemType.tokenEnd:
        let nextElem = page[idxE]; // TODO 还需判断倒数第二个是否为data类型
        if (nextElem.type == ElemType.lastEnd) {
          idxE = idxE - 1;
          page.splice(idxE - 1, 0, config.otherEnd.clone());
        }
        break;

      case ElemType.lastEnd:
        if (this.getElemsHeight(page, idxS, idxE) > config.pageHgtMax) {
          // 如果无法通过调整行高使 total 元素放进页面，
          // 则将最后一个 data 放到下一个页面
          let pageHgtMax = N.minus(N.plus(config.pageHgtMax,
                                          config.otherEnd.hgtAdjMaxRdc),
                                   config.otherEnd.height);
          if (!this.adjHgtCanBeBelowMax(page.slice(idxS, idxE),
                                        pageHgtMax)) {
            idxE = idxE - 1;
            page.splice(idxE - 2, 0, config.otherEnd.clone());
          }
        } else {
          // 加上 empty 会更接近 heightStd
          while (this.appendCloseToStdUnderMax(page.slice(idxS, idxE), [],
                                                      [config.empty],
                                                      config.pageHgtStd,
                                                      config.pageHgtMax)) {
            page.splice(idxE - 1, 0, config.empty.clone());
            idxE++;
          }
        }
        break;

      default:
        console.error(page[idxE - 1].type)
        throw new Error("Layout adjust page error #02:" + page[idxE - 1].type);
    }
    let adj = this.autoAdjHgt(page.slice(idxS, idxE), config.pageHgtStd,
                              config.pageHgtMax);
    for (let i = idxS; i < idxE; ++i) {
      let adjIdx = i - idxS;
      page[i].adjHgt(adj[0][adjIdx]);
    }
    return idxE;
  }

  /**
   * 调整当页高度接近std且小于最大高度。
   * @returns { [number[], number] } 该页每个元素调整次数, 离heightStd距离
   */
  protected autoAdjHgt (singlePage: readonly Elem[], hgtStd: number,
                        hgtMax: number): [number[], number] {
    let curHeight = this.getElemsHeight(singlePage, 0, singlePage.length);
    let adjTimes = new Array<number>(singlePage.length).fill(0);
    if (curHeight != hgtStd) {
      let isRdc = curHeight > hgtStd;
      let adjTimesMax = singlePage.map(elem => isRdc ?
                                      elem.adjMaxTimesRdc:elem.adjMaxTimesInc);
      let ord = Array.from(new Set(singlePage.map(e=> e.heightAdjOrd))).sort();
      let ordIdx = ord.length - 1;
      // 当一轮调整中没有可调，则意味已经接近了标准高度
      let adjustFlag = true;
      let dist = this.dist(curHeight, hgtStd);
      // TODO 相同类型的行会出现高度不一的问题
      while (!adjTimesMax.every(v => v == 0) && adjustFlag && dist > 0) {
        adjustFlag = false;
        for (let i = 0; i < singlePage.length; ++i) {
          if (adjTimesMax[i] > 0 && singlePage[i].heightAdjOrd >= ord[ordIdx]){
            let adjAcc = singlePage[i].hgtAdjAcc * (isRdc ? -1 : 1);
            if (this.closeToStd(curHeight, adjAcc, hgtStd, hgtMax)) {
              adjTimes[i] += isRdc ? -1 : 1;
              curHeight = N.plus(curHeight, adjAcc);
              adjTimesMax[i]--;
              adjustFlag = true;
            }
          }
        }
        if (adjustFlag == false && ordIdx > 0) {
          adjustFlag = true;
          ordIdx--;
        }
        dist = this.dist(curHeight, hgtStd);
      }
      return [adjTimes, dist];
    }
    return [adjTimes, 0];
  }

  protected adjHgtCanBeBelowMax (singlePage: readonly Elem[],
                                 hgtMax: number): boolean {
    let adjustMax = singlePage.reduce((t, e) => N.plus(t, e.hgtAdjMaxRdc), 0);
    let curHeight = this.getElemsHeight(singlePage, 0, singlePage.length);
    if (N.minus(curHeight, adjustMax) > hgtMax) {
      return false;
    }
    return true;
  }

  // /** 
  //  * 比较两个单页在最少调整高度下哪个更接近hgtStd且不超过hgtMax
  //  * true为singlepage1，false为singlepage2
  //  * */
  // protected comparePageBetter (singlePage1: readonly Elem[],
  //                              singlePage2: readonly Elem[],
  //                              hgtStd: number, hgtMax: number): boolean {
  //   return true; // TODO
  // }

  protected replacePageEndDatas (page: Page, idxS: number,
                                 idxE: number): number {
    // TODO 不仅可以替换，还可以减小行高插入
    if (page[idxE - 1].type != ElemType.data) {
      throw new Error("Layout adjust page error #03");
    }
    let hgtStd = this._config.pageHgtStd;
    let hgtMax = this._config.pageHgtMax;
    let tokenPageEnd = page[idxE - 1].getTokenPageEnd();
    let end = this._config.otherEnd;
    let maxBeRplacedNumber = 0;
    while (true) { // 仅仅替换data，并保证tokenTitle下还有一个data
      let lastIdx = idxE - 1 - maxBeRplacedNumber;
      let secondLastIdx = lastIdx - 1;
      if (page[lastIdx].type == ElemType.data &&
          page[secondLastIdx].type == ElemType.data) {
        maxBeRplacedNumber++;
      } else {
        break;
      }
    }
    let replaceNum = this.replaceNElemCloseToStd(page.slice(idxS,idxE), hgtStd,
                                                 hgtMax, [tokenPageEnd, end],
                                                 maxBeRplacedNumber);
    if (replaceNum < 0) {
      // 仅仅替换data还不够，还需要把token title也替换掉
      if (page[idxE - maxBeRplacedNumber - 2].type == ElemType.tokenTitle) {
        // TODO 可能还需考虑token title 上面的元素
        // 还要替换第一个data与token title
        let replaceNum = maxBeRplacedNumber + 2; 
        if (this.replaceCloseToStd(page.slice(idxS, idxE), hgtStd, hgtMax,
                                   [tokenPageEnd, end], replaceNum)) {
          for (let i = 0; i < replaceNum; ++i) {
            idxE--;
          }
          page.splice(idxE++, 0, tokenPageEnd.clone());
          page.splice(idxE++, 0, end.clone());
        }
      } else {
        throw new Error("Layout adjust page error #04");
      }
    } else {
      for (let i = 0; i < replaceNum; ++i) {
        idxE--;
      }
      page.splice(idxE++, 0, tokenPageEnd.clone());
      page.splice(idxE++, 0, end.clone());
    }
    return idxE;
  }
}

