
const STORAGE_KEY = 'fleurs_payment_info';

let info = { method: 'gcash' };

export const setPaymentInfo = (value) => {
  if (!value || !['cash', 'gcash'].includes(value.method)) {
    console.error('Invalid payment method.');
    return;
  }

  info = { ...value };

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(info));
  } catch (error) {
    console.warn('Could not save payment info:', error);
  }
};

export const getPaymentInfo = () => {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      if (parsed && ['cash', 'gcash'].includes(parsed.method)) {
        info = parsed;
      }
    }
  } catch (error) {
    console.warn('Could not read payment info:', error);
  }

  return { ...info };
};

export const clearPaymentInfo = () => {
  info = { method: 'gcash' };

  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Could not clear payment info:', error);
  }
};
