import { BigNumber } from 'bignumber.js';

export class BigNum {
  public static minus (...a: number[]): number {
    let d = new BigNumber(a[0]);
    for (let i = 1; i < a.length; ++i) {
      let n = new BigNumber(a[i]);
      d = d.minus(n);
    }
    return d.toNumber();
  }

  public static plus (...a: number[]): number {
    let sum = new BigNumber(0);
    a.forEach(i => {
      let n_i = new BigNumber(i);
      sum = sum.plus(n_i);
    });
    return sum.toNumber();
  }

  public static div (...a: number[]): number {
    let d = new BigNumber(a[0]);
    for (let i = 1; i < a.length; ++i) {
      let n = new BigNumber(a[i]);
      d = d.div(n);
    }
    return d.toNumber();
  }

  public static times (...a: number[]): number {
    let d = new BigNumber(a[0]);
    for (let i = 1; i < a.length; ++i) {
      let n = new BigNumber(a[i]);
      d = d.times(n);
    }
    return d.toNumber();
  }

  public static round (a: number, length: number = 0): number {
    length = Math.round(length);
    length = length >= 0 ? length : 0;
    let n_a = new BigNumber(a);
    return n_a.dp(length).toNumber();
  }

  public static pow (a: number, b: number): number {
    let num = new BigNumber(a);
    return num.pow(b).toNumber();
  }

  public static roundDown (a: number, length: number = 0): number {
    length = Math.round(length);
    length = length >= 0 ? length : 0;
    let n = 1;
    for (let i = 1; i <= length; ++i) {
      n *= 10;
    }
    if (a >= 0) {
      return this.div(Math.floor(this.times(a, n)), n);
    } else {
      return this.div(this.plus(Math.floor(this.times(a, n)), 1), n);
    }
  }
}

