// Formats a number as Philippine pesos with two decimals, e.g. ₱1,250.00
export const formatPeso = (amount) =>
  `₱${Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
