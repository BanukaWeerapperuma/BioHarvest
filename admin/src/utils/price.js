export const formatPriceValue = (value = 0) => {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return '0.00';
  }
  return number.toFixed(2);
};

export const formatCurrency = (value = 0, symbol = '$') => {
  return `${symbol}${formatPriceValue(value)}`;
};

