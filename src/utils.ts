// import { Report } from "./report";
import * as child from 'child_process';

export class Utils {
  public static getSumFormula (colNum: number, rowNumbers: number[]): string {
    if (rowNumbers.length == 0) {
      return "0";
    }
    const alpha = [ 'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O',
      'P','Q','R','S','T','U','V','W','X','Y','Z' ];
    let col = "";
    let x = colNum;
    let y = 0;
    while (x > 26) {
      y = x % 26;
      x = Math.floor(x / 26);
      col = alpha[y - 1] + col;
    }
    col = alpha[x - 1] + col;
    let sum = "SUM(" + col + rowNumbers[0] + ":";
    for (let i = 1; i < rowNumbers.length; ++i) {
      if (rowNumbers[i] - rowNumbers[i - 1] != 1) {
        sum += col + rowNumbers[i - 1] + "," + col + rowNumbers[i] + ":";
      }
    }
    sum += col + rowNumbers[rowNumbers.length - 1] + ")";
    return sum;
  }

  public static getHeights (xlsx: string, sheet: string) {
    const res = child.execFileSync("get-sheet-heights",
                                      ["-xlsx-file", xlsx, "-sheet", sheet]);
    const str = res.toString();
    const heights = str.split(",").map(s => Number(s));
    return heights;
  }

  // 向右移位
  private static shiftRight(number: number, digit: number) {
    digit = parseInt("" + digit, 10);
    var value = number.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? +value[1] + digit : digit));
  }
  // 向左移位
  private static shiftLeft(number: number, digit: number) {
    digit = parseInt("" + digit, 10);
    var value = number.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? +value[1] - digit : -digit));
  }

  public static digitUppercase (n: number) {
    var fraction = ['角', '分'];
    var digit = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
    var unit = [
      ['元', '万', '亿'],
      ['', '拾', '佰', '仟'],
    ];
    var head = n < 0 ? '欠' : '';
    n = Math.abs(n);
    var s = '';
    for (var i = 0; i < fraction.length; i++) {
      s += (digit[Math.floor(this.shiftRight(n, 1 + i)) % 10] + fraction[i])
        .replace( /零./, '');
    }
    s = s || '整';
    n = Math.floor(n);
    for (var i = 0; i < unit[0].length && n > 0; i++) {
      var p = '';
      for (var j = 0; j < unit[1].length && n > 0; j++) {
        p = digit[n % 10] + unit[1][j] + p;
        n = Math.floor(this.shiftLeft(n, 1));
      }
      s = p.replace(/(零.)*零$/, '').replace(/^$/, '零') + unit[0][i] + s;
    }
    return (
      head +
      s
        .replace(/(零.)*零元/, '元')
        .replace(/(零.)+/g, '零')
        .replace(/^整$/, '零元整')
    );
  };

  public static mergeStrArr (str: string[]): string {
    if (str.length == 0) {
      return "";
    }
    let res: string[] = [];
    for (let i = 0; i < str.length; ++i) {
      let s = str[i].toUpperCase();
      if (res.indexOf(s) == -1) {
        res.push(s);
      }
    }
    let res_str = "";
    let delimiter = "、";
    res.forEach((s, i) => {
      if (i != res.length - 1) {
        res_str += s + delimiter;
      } else {
        res_str += s;
      }
    });
    return res_str;
  }

  public static  mergeString (string_1: string, string_2: string): string {
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
    string_merge = string_merge.replace(/、$/, '');
    return string_merge;
  }

  public static addZeroBeforeNum (num: number, length: number): string {
    let str = "" + num;
    while (str.length < length) {
      str = "0" + str;
    }
    return str;
  }
}

