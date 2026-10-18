let info = { method: 'gcash' };

export const setPaymentInfo = (value) => {
  info = value;
};

export const getPaymentInfo = () => info;