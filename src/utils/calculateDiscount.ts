/** Discounted price in whole BDT (rounded for display). */
export const calculateDiscount = (price: number, discount: number): number => {
  return Math.round(price * (1 - discount / 100));
};
