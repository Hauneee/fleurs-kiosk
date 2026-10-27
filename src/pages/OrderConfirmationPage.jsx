import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  RotateCcw,
  SearchCheck,
  Download,
  Receipt,
} from 'lucide-react';
import '../styles/confirmation.css';

const COLORS = {
  pink: '#E879A5',
  lightPink: '#F8C9DA',
  darkPink: '#C2255C',
  cream: '#FFF9FA',
  text: '#684854',
  white: '#FFFFFF',
};

const formatPeso = (amount) =>
  Number(amount ?? 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getItems = (order) =>
  order?.items || order?.order_items || order?.cart || [];

const getCustomer = (order) =>
  order?.customer || order?.customer_info || {};

const getOrderNumber = (order) =>
  order?.order_number ||
  order?.orderNumber ||
  order?.id ||
  'N/A';

const getPaymentMethod = (order) =>
  order?.payment_method ||
  order?.paymentMethod ||
  'Not available';

const getItemName = (item) =>
  item?.product_name ||
  item?.name ||
  'Flower arrangement';

const getItemPrice = (item) => {
  const quantity = Number(item?.quantity) || 1;

  return Number(
    item?.line_total ??
      item?.subtotal ??
      item?.total ??
      (Number(item?.unit_price ?? item?.price) || 0) *
        quantity
  );
};

// ===============================
// FULL RECEIPT GENERATOR
// ===============================

const drawFullReceipt = (order) =>
  new Promise((resolve, reject) => {
    try {
      const items = getItems(order);
      const customer = getCustomer(order);
      const paymentMethod = String(getPaymentMethod(order));

      const total = Number(
        order?.total_amount ??
          order?.totalAmount ??
          order?.total ??
          0
      );

      const width = 900;
      const padding = 56;
      const rightEdge = width - padding;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = 10000;

      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not create the receipt.');
      }

      ctx.fillStyle = COLORS.cream;
      ctx.fillRect(0, 0, width, canvas.height);

      ctx.fillStyle = COLORS.darkPink;
      ctx.fillRect(0, 0, width, 18);

      let y = 85;

      const text = (
        value,
        x,
        baseline,
        size = 24,
        color = COLORS.text,
        weight = '400',
        align = 'left'
      ) => {
        ctx.font = `${weight} ${size}px Arial, sans-serif`;
        ctx.fillStyle = color;
        ctx.textAlign = align;
        ctx.fillText(String(value ?? ''), x, baseline);
      };

      const center = (
        value,
        size,
        color = COLORS.text,
        weight = '400'
      ) => {
        text(
          value,
          width / 2,
          y,
          size,
          color,
          weight,
          'center'
        );
        y += size + 16;
      };

      const divider = () => {
        y += 10;
        ctx.strokeStyle = '#E8C7D1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(rightEdge, y);
        ctx.stroke();
        y += 34;
      };

      const wrappedLines = (value, maxWidth, font) => {
        ctx.font = font;

        const words = String(value ?? '').split(/\s+/);
        const lines = [];
        let line = '';

        words.forEach((word) => {
          const candidate = line
            ? `${line} ${word}`
            : word;

          if (
            ctx.measureText(candidate).width > maxWidth &&
            line
          ) {
            lines.push(line);
            line = word;
          } else {
            line = candidate;
          }
        });

        if (line) lines.push(line);

        return lines.length ? lines : [''];
      };

      const wrapped = (
        value,
        x,
        maxWidth,
        size = 21,
        color = COLORS.text,
        weight = '400',
        lineGap = 31
      ) => {
        const font = `${weight} ${size}px Arial, sans-serif`;

        const lines = wrappedLines(
          value,
          maxWidth,
          font
        );

        lines.forEach((line) => {
          text(line, x, y, size, color, weight);
          y += lineGap;
        });
      };

      center('FLEURS', 48, COLORS.darkPink, '800');
      center('by Blossoms Craft', 29, COLORS.text, '600');
      center(
        'OFFICIAL ORDER RECEIPT',
        27,
        COLORS.darkPink,
        '700'
      );

      divider();

      wrapped(
        `Order Number: ${getOrderNumber(order)}`,
        padding,
        width - padding * 2,
        24,
        '#3F1424',
        '700'
      );

      const dateValue =
        order?.created_at || order?.createdAt;

      const dateText = dateValue
        ? new Date(dateValue).toLocaleString('en-PH', {
            timeZone: 'Asia/Manila',
            dateStyle: 'medium',
            timeStyle: 'short',
          })
        : new Date().toLocaleString('en-PH', {
            timeZone: 'Asia/Manila',
            dateStyle: 'medium',
            timeStyle: 'short',
          });

      wrapped(
        `Date: ${dateText}`,
        padding,
        width - padding * 2,
        20
      );

      divider();

      text(
        'CUSTOMER DETAILS',
        padding,
        y,
        24,
        COLORS.darkPink,
        '700'
      );

      y += 44;

      const customerFields = [
        [
          'Customer Name',
          customer?.name ||
            order?.customer_name ||
            order?.name,
        ],
        [
          'Email',
          customer?.email ||
            order?.customer_email ||
            order?.email,
        ],
        [
          'Phone',
          customer?.phone ||
            order?.customer_phone ||
            order?.phone,
        ],
      ];

      customerFields.forEach(([label, value]) => {
        wrapped(
          `${label}: ${value || 'N/A'}`,
          padding,
          width - padding * 2,
          21
        );
        y += 4;
      });

      divider();

      text(
        'ORDER ITEMS',
        padding,
        y,
        24,
        COLORS.darkPink,
        '700'
      );

      y += 48;

      if (items.length > 0) {
        items.forEach((item) => {
          const name = getItemName(item);
          const quantity = Number(item?.quantity) || 1;
          const price = getItemPrice(item);

          const nameLines = wrappedLines(
            `${name} × ${quantity}`,
            530,
            '600 21px Arial, sans-serif'
          );

          text(
            nameLines[0],
            padding,
            y,
            21,
            COLORS.text,
            '600'
          );

          text(
            `₱${formatPeso(price)}`,
            rightEdge,
            y,
            21,
            COLORS.text,
            '600',
            'right'
          );

          y += 32;

          nameLines.slice(1).forEach((line) => {
            text(
              line,
              padding + 12,
              y,
              19,
              COLORS.text
            );
            y += 29;
          });

          y += 12;
        });
      } else {
        wrapped(
          'No item details available.',
          padding,
          width - padding * 2
        );
      }

      divider();

      text(
        'TOTAL',
        padding,
        y,
        31,
        COLORS.darkPink,
        '800'
      );

      text(
        `₱${formatPeso(total)}`,
        rightEdge,
        y,
        31,
        COLORS.darkPink,
        '800',
        'right'
      );

      y += 56;

      wrapped(
        `Payment Method: ${paymentMethod}`,
        padding,
        width - padding * 2,
        21,
        '#3F1424',
        '600'
      );

      y += 5;

      const paidValue =
        order?.amount_paid ??
        order?.cash_received ??
        order?.cashReceived;

      if (
        paidValue !== undefined &&
        paidValue !== null &&
        Number.isFinite(Number(paidValue))
      ) {
        text('Amount Paid', padding, y, 21);

        text(
          `₱${formatPeso(paidValue)}`,
          rightEdge,
          y,
          21,
          COLORS.text,
          '600',
          'right'
        );

        y += 36;
      }

      const changeValue =
        order?.change_amount ?? order?.change;

      if (
        paymentMethod.toLowerCase() === 'cash' &&
        changeValue !== undefined &&
        changeValue !== null &&
        Number.isFinite(Number(changeValue))
      ) {
        text('Change', padding, y, 21);

        text(
          `₱${formatPeso(changeValue)}`,
          rightEdge,
          y,
          21,
          COLORS.text,
          '600',
          'right'
        );

        y += 36;
      }

      divider();

      center('Thank you for choosing', 22, COLORS.text);
      center(
        'Fleurs by Blossoms Craft',
        28,
        COLORS.darkPink,
        '700'
      );
      center(
        'Please keep this receipt for your records.',
        18
      );

      const finalCanvas = document.createElement('canvas');

      finalCanvas.width = width;
      finalCanvas.height = Math.ceil(y + 35);

      const finalCtx = finalCanvas.getContext('2d');

      if (!finalCtx) {
        throw new Error('Could not finish the receipt.');
      }

      finalCtx.fillStyle = COLORS.cream;

      finalCtx.fillRect(
        0,
        0,
        width,
        finalCanvas.height
      );

      finalCtx.drawImage(
        canvas,
        0,
        0,
        width,
        finalCanvas.height,
        0,
        0,
        width,
        finalCanvas.height
      );

      finalCanvas.toBlob((blob) => {
        if (!blob) {
          reject(
            new Error('Could not download the receipt image.')
          );
          return;
        }

        resolve(blob);
      }, 'image/png');
    } catch (error) {
      reject(error);
    }
  });

// ===============================
// ORDER CONFIRMATION PAGE
// ===============================

export const OrderConfirmationPage = ({
  order,
  proofUrl,
  onNewOrder,
  onTrack,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState('');

  useEffect(() => {
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: [
          COLORS.darkPink,
          COLORS.pink,
          COLORS.lightPink,
          COLORS.white,
        ],
      });
    } catch {
      // Ignore confetti errors.
    }
  }, []);

  if (!order) return null;

  const formattedDate = new Date(
    order.created_at ||
      order.createdAt ||
      Date.now()
  ).toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const paymentMethod = String(getPaymentMethod(order));
  const items = getItems(order);
  const customer = getCustomer(order);

  const total = Number(
    order.total_amount ??
      order.totalAmount ??
      order.total ??
      0
  );

  const amountPaid = Number(
    order.amount_paid ??
      order.cash_received ??
      order.cashReceived ??
      (paymentMethod.toLowerCase() === 'cash'
        ? 0
        : total)
  );

  const changeAmount = Number(
    order.change_amount ?? order.change ?? 0
  );

  const downloadReceipt = async () => {
    setDownloading(true);
    setDownloadMessage('');

    try {
      const blob = await drawFullReceipt(order);
      const url = URL.createObjectURL(blob);

      const safeNumber = String(getOrderNumber(order))
        .replace(/[^a-zA-Z0-9-_]/g, '-');

      const link = document.createElement('a');

      link.href = url;
      link.download = `Fleurs-Receipt-${safeNumber}.png`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 5000);

      setDownloadMessage(
        'Your receipt download has started. Check your Downloads folder.'
      );
    } catch (error) {
      console.error('Receipt download failed:', error);

      setDownloadMessage(
        error?.message ||
          'Unable to generate the receipt. Please try again.'
      );
    } finally {
      setDownloading(false);
    }
  };

  const sectionStyle = {
    background: '#FFF8FA',
    border: '1px solid #F0D5DE',
    borderRadius: '18px',
    padding: '20px',
    marginTop: '18px',
  };

  const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    padding: '12px 0',
    borderBottom: '1px solid #F3E1E7',
    color: COLORS.text,
  };

  const actionButtonStyle = {
    display: 'flex',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
    padding: '16px',
    border: 'none',
    borderRadius: '14px',
    fontWeight: 800,
    fontSize: '1rem',
    cursor: 'pointer',
  };

  return (
    <div className="fl-done">
      <div
        className="fl-done__card"
        style={{
          maxWidth: '680px',
          margin: '0 auto',
          borderRadius: '28px',
          overflow: 'hidden',
          boxShadow: '0 18px 55px rgba(194, 37, 92, 0.12)',
        }}
      >
        {/* SUCCESS HEADER */}

        <div
          style={{
            background: 'linear-gradient(135deg, #FFF0F5, #FFFFFF)',
            padding: '28px 20px 20px',
            textAlign: 'center',
          }}
        >
          <div
            className="fl-done__check"
            style={{
              margin: '0 auto 16px',
              color: COLORS.darkPink,
            }}
          >
            <CheckCircle2 size={52} strokeWidth={2.2} />
          </div>

          <p
            style={{
              color: COLORS.darkPink,
              fontWeight: 800,
              letterSpacing: '2px',
              fontSize: '0.82rem',
              marginBottom: '8px',
            }}
          >
            FLEURS BY BLOSSOMS CRAFT
          </p>

          <h1 className="fl-done__title">
            Your order is placed!
          </h1>

          <p className="fl-done__lead">
            Thank you for your order! We are preparing
            your flowers with care.
          </p>
        </div>

        <div style={{ padding: '0 20px 26px' }}>
          {/* ORDER NUMBER */}

          <div
            style={{
              background: COLORS.darkPink,
              color: COLORS.white,
              borderRadius: '20px',
              padding: '22px',
              textAlign: 'center',
              marginTop: '8px',
            }}
          >
            <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>
              YOUR ORDER NUMBER
            </p>

            <p
              style={{
                fontSize: '1.8rem',
                fontWeight: 900,
                margin: '8px 0',
                overflowWrap: 'anywhere',
              }}
            >
              {getOrderNumber(order)}
            </p>

            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>
              {formattedDate}
            </p>
          </div>

          {/* ORDER SUMMARY */}

          <section style={sectionStyle}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px',
              }}
            >
              <Receipt size={30} color={COLORS.darkPink} />

              <div>
                <h2 style={{ color: COLORS.text, margin: 0 }}>
                  Order Summary
                </h2>

                <p
                  style={{
                    color: '#92717E',
                    margin: '5px 0 0',
                    fontSize: '0.9rem',
                  }}
                >
                  Here are the details of your order.
                </p>
              </div>
            </div>

            <div
              style={{
                ...rowStyle,
                flexDirection: 'column',
                gap: '5px',
              }}
            >
              <span>Customer</span>

              <strong style={{ overflowWrap: 'anywhere' }}>
                {customer.name ||
                  order.customer_name ||
                  order.name ||
                  'N/A'}
              </strong>
            </div>

            <div style={rowStyle}>
              <span>Payment Method</span>
              <strong>{paymentMethod}</strong>
            </div>

            <div style={{ marginTop: '18px' }}>
              <h3 style={{ color: COLORS.darkPink, marginBottom: '8px' }}>
                Order Items
              </h3>

              {items.length > 0 ? (
                items.map((item, index) => (
                  <div
                    key={item.id || `${getItemName(item)}-${index}`}
                    style={rowStyle}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {getItemName(item)}
                      </div>

                      <div
                        style={{
                          color: '#92717E',
                          fontSize: '0.9rem',
                          marginTop: '4px',
                        }}
                      >
                        Quantity: {Number(item.quantity) || 1}
                      </div>
                    </div>

                    <strong style={{ whiteSpace: 'nowrap' }}>
                      ₱{formatPeso(getItemPrice(item))}
                    </strong>
                  </div>
                ))
              ) : (
                <p style={{ color: COLORS.text }}>
                  Item details are unavailable.
                </p>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '12px',
                marginTop: '18px',
                padding: '18px',
                borderRadius: '14px',
                background: '#FCE5ED',
                color: COLORS.darkPink,
                fontWeight: 900,
                fontSize: '1.2rem',
              }}
            >
              <span>Total</span>
              <span>₱{formatPeso(total)}</span>
            </div>

            <div style={{ marginTop: '12px' }}>
              <div style={rowStyle}>
                <span>Amount Paid</span>
                <strong>₱{formatPeso(amountPaid)}</strong>
              </div>

              {paymentMethod.toLowerCase() === 'cash' && (
                <div style={{ ...rowStyle, borderBottom: 'none' }}>
                  <span>Change</span>
                  <strong>₱{formatPeso(changeAmount)}</strong>
                </div>
              )}
            </div>
          </section>

          {/* PHOTO PROOF */}

          {proofUrl && (
            <section
              className="fl-photo fl-photo--done"
              style={sectionStyle}
            >
              <h2 style={{ color: COLORS.text }}>
                Photo Proof
              </h2>

              <div className="fl-photo__frame">
                <img
                  src={proofUrl}
                  alt="Photo taken with your order"
                  className="fl-photo__video"
                />
              </div>

              <p style={{ color: COLORS.text }}>
                You can see this photo again in Track My Order.
              </p>
            </section>
          )}

          {/* ACTIONS: RECEIPT ABOVE TRACK ORDER */}

          <div
            className="fl-done__actions"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginTop: '22px',
            }}
          >
            {/* DOWNLOAD RECEIPT — FIRST BUTTON */}

            <button
              type="button"
              onClick={downloadReceipt}
              disabled={downloading}
              style={{
                ...actionButtonStyle,
                background: downloading
                  ? '#B87A93'
                  : COLORS.darkPink,
                color: COLORS.white,
                cursor: downloading ? 'wait' : 'pointer',
              }}
            >
              <Download size={21} />

              {downloading
                ? 'Preparing Receipt...'
                : 'Download Full Receipt'}
            </button>

            {downloadMessage && (
              <p
                role="status"
                style={{
                  color: COLORS.text,
                  fontSize: '0.9rem',
                  margin: '0 0 4px',
                  overflowWrap: 'anywhere',
                  textAlign: 'center',
                }}
              >
                {downloadMessage}
              </p>
            )}

            {/* TRACK ORDER — BELOW RECEIPT */}

            {onTrack && (
              <button
                type="button"
                className="fl-btn fl-btn--soft"
                onClick={onTrack}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                }}
              >
                <SearchCheck size={22} />
                Track this order
              </button>
            )}

            {/* BACK TO MENU */}

            <button
              type="button"
              className="fl-btn fl-btn--rose"
              onClick={onNewOrder}
              style={{
                width: '100%',
                justifyContent: 'center',
              }}
            >
              <RotateCcw size={22} />
              Back to menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;