import * as Lo from './layout'

class LayoutTest extends Lo.Layout {
  constructor (config: Lo.Config) {
    super(config);
  }

  // public testInitPage () {
  //   let configData: Lo.ConfigData = [];
  //   let dataHgt: Lo.DataHgt = new Lo.DataHgt(
  //     [
  //       [-1, -1, -1, -1],
  //       [6, 1, 0, 40, 9999, -1],
  //       [
  //         [-1]
  //       ]
  //     ]
  //   );
  //   let page = this.initPage(configData, dataHgt);
  // }

  public testAdjust () {
    const ET = Lo.ElemType;
    let config: Lo.Config = {
      pageHgtStd: 1000,
      pageHgtMax: 1000,
      firstTitle: new Lo.Elem(ET.firstTitle, 1, 2, [100], [50, 50]),
      otherTitle: new Lo.Elem(ET.otherTitle, 2, 3, [100], [50, 50]),
      data: [
        new Lo.DataToken(
          new Lo.Elem(ET.tokenTitle, 3, 4, [50]),
          [new Lo.Elem(ET.data, 4, 5, [50], [3, 3])],
          new Lo.Elem(ET.tokenPageEnd, 5, 6, [50]),
          new Lo.Elem(ET.tokenEnd, 6, 7, [50]),
          false, true)
      ],
      empty: new Lo.Elem(ET.empty, 7, 8, [50], [3, 3]),
      otherEnd: new Lo.Elem(ET.otherEnd, 8, 9, [100], [50, 50]),
      lastEnd: new Lo.Elem(ET.lastEnd, 9, 10, [100], [50, 50]),
    }
  }
}

