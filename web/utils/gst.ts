// Tax-inclusive calculation — selling price already includes GST
export function calcGST(price: number, qty: number, gstPercent: number) {
  const lineTotal = parseFloat((price * qty).toFixed(2));
  const taxable = parseFloat((lineTotal / (1 + gstPercent / 100)).toFixed(2));
  const gstAmount = parseFloat((lineTotal - taxable).toFixed(2));
  return { lineTotal, taxable, gstAmount };
}
