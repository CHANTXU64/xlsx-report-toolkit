import * as fs from 'fs';
import * as child from 'child_process';

export class XlsxHeights {[id: string]: number[]};

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

  public static getHeights (path: string): XlsxHeights {
    let file: Buffer;
    try {
      file = fs.readFileSync(path);
    } catch (e) {
      return {};
    }
    let j: {[id: string]: string} = JSON.parse(file.toString());
    let res: XlsxHeights = {};
    for (let i in j) {
      let r = j[i].split(",").map(s => Number(s));
      res[i] = r;
    }
    return res;
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

  public static checkConsistency<T> (arr: T[]): boolean {
    if (arr.length === 0) {
      return true;
    }
    const firstElement = arr[0];
    for (let i = 1; i < arr.length; i++) {
      if (arr[i] !== firstElement) {
        return false;
      }
    }
    return true;
  }

  public static addMonthsToDate (date: Date, months: number): Date {
    let year = date.getFullYear();
    let month = date.getMonth();
    let day = date.getDate();
    if (month + months >= 0 && month + months <= 11) {
      let newDate = new Date(year, month + months + 1, 0);
      let maxDaysInMonth = newDate.getDate();
      if (day > maxDaysInMonth) {
        return new Date(year, month + months, maxDaysInMonth);
      } else {
        return new Date(year, month + months, day);
      }
    } else {
      if (months < 0) {
        months = months + month + 1;
        return this.addMonthsToDate(new Date(year - 1, 11, day), months);
      } else {
        months = months - (12 - month);
        return this.addMonthsToDate(new Date(year + 1, 0, day), months);
      }
    }
  }

  public static arabicNumToCNNum (digit: number): string {
    const chineseDigitTable = [
      '零',
      '一',
      '二',
      '三',
      '四',
      '五',
      '六',
      '七',
      '八',
      '九',
      '十',
      '百',
      '千',
      '万',
      '亿',
      '万亿'
    ];

    const ploy = {
      /**
       * @description 小于100的数转换
       * @param digital
       * @returns
       */
      ltHundred(digital: number) {
        if (digit <= 10) {
          return chineseDigitTable[digit];
        }

        const ten = Math.trunc(digital / 10);
        const cnDigit =
          (ten > 1 ? chineseDigitTable[ten] : '') + chineseDigitTable[10];

        const num = digital % 10;
        if (num === 0) {
          return cnDigit;
        }

        return cnDigit + chineseDigitTable[num];
      },
      /**
       * @description 小于1000的数转换
       * @param digital
       * @returns
       */
      ltThousand(digital: number) {
        let cnDigit =
          chineseDigitTable[Math.trunc(digital / 100)] + chineseDigitTable[11];

        const num = digital % 100;
        if (num === 0) {
          return cnDigit;
        }

        if (num < 10) {
          return cnDigit + chineseDigitTable[0] + chineseDigitTable[num];
        }

        // 处理110/214等情况 => 二百一十四
        if (num >= 10 && num < 20) {
          cnDigit += chineseDigitTable[1] + chineseDigitTable[10];
          if (num > 10) {
            cnDigit += chineseDigitTable[num - 10];
          }

          return cnDigit;
        }

        return cnDigit + ploy.ltHundred(num);
      },
      /**
       * 小于一万的数转换
       * @param digital
       * @returns
       */
      ltTenThousand(digital: number) {
        const cnDigit =
          chineseDigitTable[Math.trunc(digital / 1000)] + chineseDigitTable[12];

        const num = digital % 1000;
        if (num === 0) {
          return cnDigit;
        }
        if (num < 10) {
          return cnDigit + chineseDigitTable[0] + chineseDigitTable[num];
        }
        if (num < 100) {
          if (num === 10) {
            return (
              cnDigit +
              chineseDigitTable[0] +
              chineseDigitTable[1] +
              chineseDigitTable[10]
            );
          }
          return cnDigit + chineseDigitTable[0] + ploy.ltHundred(num);
        }

        return cnDigit + ploy.ltThousand(num);
      },
      /**
       * @description 亿到万亿
       * @param digital
       * @returns
       */
      gtBillion(digital: number) {
        let digitString = digital.toString();
        const digitLen = digitString.length;
        if (digitLen > 16 || digitLen < 5) {
          return '';
        }
        if (digitLen <= 8) {
          digitString = digitString.padStart(8, '0');
        } else if (digitLen <= 12) {
          digitString = digitString.padStart(12, '0');
        } else {
          digitString = digitString.padStart(16, '0');
        }

        // 将大数字拆分，例如：123456789 => ['0001', '2345', '6789']
        const digits = digitString
          .split(/([0-9]{4})/)
          .filter((item) => item !== '');

        let cnDigit = '';
        const len = digits.length;
        digits.forEach((item, index) => {
          const num = Number(item);
          let text = '';
          if (num !== 0) {
            text = Utils.arabicNumToCNNum(num);
          }

          if (index !== 0) {
            // 这种情况 [0002, 0001] [0010, 3400] 都需要补零
            if (
              (num > 0 && num < 1000) ||
              digits[index - 1].lastIndexOf('0') === 3
            ) {
              cnDigit += chineseDigitTable[0];
            }
          }

          // 数字小于一亿 => 1万至9999万...
          if (len === 2) {
            if (index === 0) {
              cnDigit = text + chineseDigitTable[13];
              return;
            }

            cnDigit += text;
            return;
          }

          // 数字小于一万亿
          if (len === 3) {
            if (index === 0) {
              cnDigit = text + chineseDigitTable[14];
              return;
            }

            if (index === 1 && num !== 0) {
              cnDigit += text + chineseDigitTable[13];
              return;
            }

            cnDigit += text;
            return;
          }

          // 千万亿级别
          if (len === 4) {
            if (index === 0) {
              cnDigit = text + chineseDigitTable[15];
              return;
            }

            if (index === 1 && num !== 0) {
              cnDigit += text + chineseDigitTable[14];
              return;
            }

            if (index === 2 && num !== 0) {
              cnDigit += text + chineseDigitTable[13];
              return;
            }

            cnDigit += text;
            return;
          }
        });

        return cnDigit;
      }
    };

    let chineseDigit = '';
    digit = digit | 0;
    if (digit < 0) {
      chineseDigit += '负';
      digit = Math.abs(digit);
    }
    if (digit < 100) {
      return chineseDigit + ploy.ltHundred(digit);
    }
    if (digit < 1000) {
      return chineseDigit + ploy.ltThousand(digit);
    }
    if (digit < 10000) {
      return chineseDigit + ploy.ltTenThousand(digit);
    }

    chineseDigit += ploy.gtBillion(digit);

    return chineseDigit;
  };

  public static range (s: number, e: number): number[] {
    const arr: number[] = [];
    for (let i = s; i < e; ++i) {
      arr.push(i);
    }
    return arr;
  }
}

