export const calculateQuantity = (qty: string | number | null | undefined): number => {
  if (qty === null || qty === undefined) return 1;
  if (typeof qty === "number") return qty;
  const clean = qty.trim();
  if (clean === "") return 1;
  const pattern = /^\d+(?:\s*[xX*×]\s*\d+)*$/;
  if (!pattern.test(clean)) return 1;
  const parts = clean.split(/[xX*×]/);
  let product = 1;
  for (const part of parts) {
    const valStr = part.trim();
    if (!/^\d+$/.test(valStr)) return 1;
    const val = parseInt(valStr, 10);
    if (isNaN(val) || val <= 0) return 1;
    product *= val;
  }
  return product;
};
