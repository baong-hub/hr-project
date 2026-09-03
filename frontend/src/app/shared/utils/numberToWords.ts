const units = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
const tens = ["", "mười", "hai mươi", "ba mươi", "bốn mươi", "năm mươi", "sáu mươi", "bảy mươi", "tám mươi", "chín mươi"];

function readGroupVN(group: number, showZeroHundred: boolean): string {
  const hundred = Math.floor(group / 100);
  const ten = Math.floor((group % 100) / 10);
  const unit = group % 10;
  let res = "";

  if (hundred > 0 || showZeroHundred) {
    res += units[hundred] + " trăm ";
  }

  if (ten > 0) {
    if (ten === 1) {
      res += "mười ";
    } else {
      res += tens[ten] + " ";
    }
  } else if (hundred > 0 || showZeroHundred) {
    if (unit > 0) res += "lẻ ";
  }

  if (unit > 0) {
    if (unit === 1 && ten > 1) {
      res += "mốt ";
    } else if (unit === 5 && ten > 0) {
      res += "lăm ";
    } else {
      res += units[unit] + " ";
    }
  }

  return res.trim();
}

export function readMoneyInVietnamese(amount: number): string {
  const roundedAmount = Math.round(amount);
  if (roundedAmount === 0) return "Không đồng";
  if (roundedAmount < 0) return "Âm " + readMoneyInVietnamese(Math.abs(roundedAmount));

  let str = "";
  const billion = Math.floor(roundedAmount / 1000000000);
  let temp = roundedAmount % 1000000000;
  const million = Math.floor(temp / 1000000);
  temp = temp % 1000000;
  const thousand = Math.floor(temp / 1000);
  const remaining = temp % 1000;

  let showZero = false;

  if (billion > 0) {
    str += readGroupVN(billion, false) + " tỷ ";
    showZero = true;
  }
  if (million > 0) {
    str += readGroupVN(million, showZero) + " triệu ";
    showZero = true;
  }
  if (thousand > 0) {
    str += readGroupVN(thousand, showZero) + " nghìn ";
    showZero = true;
  }
  if (remaining > 0) {
    str += readGroupVN(remaining, showZero);
  }

  str = str.trim() + " đồng";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const onesEN = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", 
               "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];

const tensEN = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function readGroupEN(num: number): string {
  let res = "";
  const hundred = Math.floor(num / 100);
  const rem = num % 100;

  if (hundred > 0) {
    res += onesEN[hundred] + " hundred ";
  }

  if (rem > 0) {
    if (rem < 20) {
      res += onesEN[rem];
    } else {
      const ten = Math.floor(rem / 10);
      const one = rem % 10;
      res += tensEN[ten];
      if (one > 0) {
        res += "-" + onesEN[one];
      }
    }
  }

  return res.trim();
}

export function readMoneyInEnglish(amount: number): string {
  const roundedAmount = Math.round(amount);
  if (roundedAmount === 0) return "Zero Vietnam dongs";
  if (roundedAmount < 0) return "Minus " + readMoneyInEnglish(Math.abs(roundedAmount));

  let str = "";
  const billion = Math.floor(roundedAmount / 1000000000);
  let temp = roundedAmount % 1000000000;
  const million = Math.floor(temp / 1000000);
  temp = temp % 1000000;
  const thousand = Math.floor(temp / 1000);
  const remaining = temp % 1000;

  if (billion > 0) {
    str += readGroupEN(billion) + " billion ";
  }
  if (million > 0) {
    str += readGroupEN(million) + " million ";
  }
  if (thousand > 0) {
    str += readGroupEN(thousand) + " thousand ";
  }
  if (remaining > 0) {
    str += readGroupEN(remaining);
  }

  str = str.trim() + " Vietnam dongs";
  return str.charAt(0).toUpperCase() + str.slice(1);
}
