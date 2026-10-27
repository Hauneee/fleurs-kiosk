
import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  ImagePlus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Download,
  Receipt,
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { formatPeso } from '../utils/formatPeso';
import '../styles/confirmation.css';

const BUCKET = 'order-proofs';
const MAX_WIDTH = 1024;
const MAX_FILE_SIZE = 15 * 1024 * 1024;

const getOrderItems = (order) =>
  order?.items || order?.order_items || order?.cart || [];

const getCustomer = (order) =>
  order?.customer || order?.customer_info || {};

const getPaymentMethod = (order) =>
  order?.payment_method ||
  order?.paymentMethod ||
  order?.method ||
  'Not specified';

const drawReceipt = (order) =>
  new Promise((resolve, reject) => {
    try {
      const items = getOrderItems(order);
      const customer = getCustomer(order);
      const paymentMethod = getPaymentMethod(order);
      const total = Number(
        order?.total_amount ??
        order?.totalAmount ??
        order?.total ??
        0
      );

      const width = 800;
      const padding = 48;
      const lineHeight = 36;
      const itemLines = items.reduce(
        (sum, item) => sum + (String(item.name || item.product_name || 'Item').length > 27 ? 2 : 1),
        0
      );

      const height = Math.max(
        850,
        540 + itemLines * lineHeight + 300
      );

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not create the receipt image.');

      ctx.fillStyle = '#FFF9FA';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#C2255C';
      ctx.fillRect(0, 0, width, 18);

      let y = 76;

      const center = (text, size, color = '#684854', weight = '600') => {
        ctx.font = `${weight} ${size}px Arial`;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.fillText(text, width / 2, y);
        y += size + 14;
      };

      const left = (text, size = 24, color = '#684854', weight = '400') => {
        ctx.font = `${weight} ${size}px Arial`;
        ctx.fillStyle = color;
        ctx.textAlign = 'left';
        ctx.fillText(text, padding, y);
      };

      const right = (text, size = 24, color = '#684854', weight = '600') => {
        ctx.font = `${weight} ${size}px Arial`;
        ctx.fillStyle = color;
        ctx.textAlign = 'right';
        ctx.fillText(text, width - padding, y);
      };

      const divider = () => {
        y += 8;
        ctx.strokeStyle = '#E8C7D1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
        y += 28;
      };

      center('FLEURS', 42, '#C2255C', '800');
      center('by Blossoms Craft', 25);
      center('ORDER RECEIPT', 30, '#C2255C', '800');

      y += 8;
      divider();

      left(`Order No.: ${order?.order_number || 'N/A'}`, 24, '#3F1424', '700');
      y += 38;

      left(
        `Date: ${order?.created_at ? new Date(order.created_at).toLocaleString() : new Date().toLocaleString()}`,
        19
      );
      y += 34;

      divider();

      left('CUSTOMER DETAILS', 23, '#C2255C', '800');
      y += 38;

      left(`Name: ${customer.name || order?.customer_name || 'N/A'}`, 21);
      y += 34;

      left(`Email: ${customer.email || order?.customer_email || 'N/A'}`, 19);
      y += 32;

      left(`Phone: ${customer.phone || order?.customer_phone || 'N/A'}`, 21);
      y += 34;

      left(`Section: ${customer.section || 'N/A'}`, 21);
      y += 38;

      divider();

      left('ORDER ITEMS', 23, '#C2255C', '800');
      y += 42;

      if (items.length) {
        items.forEach((item) => {
          const name = String(item.name || item.product_name || 'Item');
          const quantity = Number(item.quantity) || 1;
          const price = Number(item.price ?? item.unit_price) || 0;
          const lineTotal = Number(item.subtotal) || price * quantity;

          ctx.font = '600 21px Arial';
          ctx.fillStyle = '#684854';
          ctx.textAlign = 'left';

          const firstLine = name.length > 27 ? `${name.slice(0, 27)}…` : name;
          ctx.fillText(`${firstLine} × ${quantity}`, padding, y);

          ctx.textAlign = 'right';
          ctx.fillText(formatPeso(lineTotal), width - padding, y);
          y += 34;

          if (name.length > 27) {
            ctx.textAlign = 'left';
            ctx.font = '18px Arial';
            ctx.fillText(name.slice(27, 58), padding + 10, y);
            y += 30;
          }
        });
      } else {
        left('Item details unavailable', 21);
        y += 34;
      }

      y += 8;
      divider();

      left('TOTAL', 30, '#C2255C', '800');
      right(formatPeso(total), 30, '#C2255C', '800');
      y += 54;

      left(`Payment: ${paymentMethod.toUpperCase()}`, 22, '#3F1424', '700');
      y += 38;

      const received = Number(
        order?.amount_paid ??
        order?.cash_received ??
        order?.cashReceived
      );

      const change = Number(
        order?.change_amount ??
        order?.change
      );

      if (Number.isFinite(received) && received > 0) {
        left('Cash received', 21);
        right(formatPeso(received), 21);
        y += 36;
      }

      if (Number.isFinite(change) && change >= 0 && paymentMethod.toLowerCase() === 'cash') {
        left('Change', 21);
        right(formatPeso(change), 21);
        y += 36;
      }

      y += 10;
      divider();

      center('Thank you for choosing Fleurs!', 25, '#C2255C', '700');
      center('Please keep this receipt for your records.', 18);
      center('Fleurs by Blossoms Craft', 18);

      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = width;
      finalCanvas.height = y + 45;

      const finalCtx = finalCanvas.getContext('2d');
      if (!finalCtx) throw new Error('Could not finish the receipt image.');

      finalCtx.fillStyle = '#FFF9FA';
      finalCtx.fillRect(0, 0, width, finalCanvas.height);
      finalCtx.drawImage(canvas, 0, 0);

      finalCanvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Could not generate the receipt PNG.'));
          return;
        }
        resolve(blob);
      }, 'image/png');
    } catch (error) {
      reject(error);
    }
  });

export const PhotoProofPage = ({ order, onDone }) => {
  const [phase, setPhase] = useState('idle');
  const [message, setMessage] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const blobRef = useRef(null);
  const galleryRef = useRef(null);
  const previewUrlRef = useRef('');

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const clearPreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = '';
    }

    setPreviewUrl('');
    blobRef.current = null;
  };

  const showPreview = (blob) => {
    clearPreview();
    const url = URL.createObjectURL(blob);
    previewUrlRef.current = url;
    blobRef.current = blob;
    setPreviewUrl(url);
    setMessage('');
    setPhase('preview');
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase === 'live' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {
        setMessage('Camera preview failed. Please choose a photo from your gallery.');
      });
    }
  }, [phase]);

  const startCamera = async () => {
    setMessage('');

    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage('Camera unavailable. Please use Open Gallery.');
      setPhase('error');
      return;
    }

    try {
      stopCamera();
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });
      setPhase('live');
    } catch (error) {
      console.error('Camera access failed:', error);
      setMessage('Camera permission was blocked. Please choose a photo from your gallery.');
      setPhase('error');
    }
  };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video?.videoWidth) {
      setMessage('Camera is not ready yet. Please try again.');
      return;
    }

    const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
    const width = Math.round(video.videoWidth * scale);
    const height = Math.round(video.videoHeight * scale);
    const canvas = document.createElement('canvas');

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setMessage('Could not process the photo.');
      return;
    }

    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob((blob) => {
      if (!blob) {
        setMessage('Could not create the photo. Please try again.');
        return;
      }
      stopCamera();
      showPreview(blob);
    }, 'image/jpeg', 0.85);
  };

  const handleGallerySelection = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage('Please select an image file.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setMessage('Please choose an image under 15 MB.');
      return;
    }

    stopCamera();
    const temporaryUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const scale = Math.min(1, MAX_WIDTH / image.naturalWidth);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.naturalWidth * scale);
      canvas.height = Math.round(image.naturalHeight * scale);

      const ctx = canvas.getContext('2d');

      if (!ctx) {
        URL.revokeObjectURL(temporaryUrl);
        setMessage('Could not process this image.');
        return;
      }

      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(temporaryUrl);
        if (!blob) {
          setMessage('Could not process this image.');
          return;
        }
        showPreview(blob);
      }, 'image/jpeg', 0.85);
    };

    image.onerror = () => {
      URL.revokeObjectURL(temporaryUrl);
      setMessage('Could not open this image.');
    };

    image.src = temporaryUrl;
  };

  const downloadReceipt = async () => {
    if (!order?.order_number) {
      setMessage('Order number is missing, so the receipt cannot be generated.');
      return;
    }

    setDownloadingReceipt(true);
    setMessage('');

    try {
      const blob = await drawReceipt(order);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = `Fleurs-Receipt-${order.order_number}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setMessage('Receipt download started. Check your Downloads or save the image to Gallery/Photos.');
    } catch (error) {
      console.error('Receipt generation failed:', error);
      setMessage(error?.message || 'Could not generate the receipt.');
    } finally {
      setDownloadingReceipt(false);
    }
  };

  const openGallery = () => {
    setMessage('');
    galleryRef.current?.click();
  };

  const retake = () => {
    if (phase === 'saving') return;
    clearPreview();
    startCamera();
  };

  const removePhoto = () => {
    if (phase === 'saving') return;
    stopCamera();
    clearPreview();
    setMessage('');
    setPhase('idle');
  };

  const savePhoto = async () => {
    if (phase === 'saving') return;

    if (!blobRef.current) {
      setMessage('Please take a photo or choose one from your gallery first.');
      return;
    }

    if (!order?.order_number) {
      setMessage('Order information is missing.');
      return;
    }

    if (!supabase) {
      setMessage('Supabase is not configured. Please contact staff.');
      return;
    }

    setPhase('saving');
    setMessage('');

    try {
      const fileName = `${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, blobRef.current, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: saved, error: rpcError } = await supabase.rpc(
        'save_order_proof',
        {
          p_order_number: order.order_number,
          p_path: fileName,
        }
      );

      if (rpcError) throw rpcError;
      if (saved === false) {
        throw new Error('Could not link the photo to your order.');
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
      if (!data?.publicUrl) throw new Error('Could not retrieve the saved photo URL.');

      onDone?.(data.publicUrl);
    } catch (error) {
      console.error('Saving order proof failed:', error);
      setMessage(error?.message || 'Could not save your photo.');
      setPhase('preview');
    }
  };

  const actionStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    minHeight: '46px',
    padding: '12px 16px',
    borderRadius: '12px',
    fontWeight: 800,
    fontSize: '0.95rem',
    cursor: 'pointer',
    border: '1px solid #E8C7D1',
  };

  return (
    <div className="fl-done fl-photo-proof-page">
      <div className="fl-done__card">
        <h1 className="fl-done__title">Your Receipt & Photo Proof</h1>

        <p className="fl-done__lead">
          Download your receipt first, then take a photo with your flowers
          or choose one from your gallery as proof of delivery.
        </p>

        <section
          style={{
            margin: '0 0 24px',
            padding: '20px',
            borderRadius: '18px',
            border: '1px solid #F0D5DE',
            background: '#FFF8F8',
            textAlign: 'center',
          }}
        >
          <Receipt size={38} color="#C2255C" />

          <h2 style={{ color: '#684854', margin: '10px 0' }}>
            Order Receipt
          </h2>

          <p style={{ color: '#684854', overflowWrap: 'anywhere' }}>
            Order No.: <strong>{order?.order_number || 'N/A'}</strong>
          </p>

          <button
            type="button"
            onClick={downloadReceipt}
            disabled={downloadingReceipt}
            style={{
              ...actionStyle,
              background: '#C2255C',
              color: '#FFFFFF',
              borderColor: '#C2255C',
              width: '100%',
              maxWidth: '340px',
            }}
          >
            <Download size={20} />
            {downloadingReceipt ? 'Preparing receipt...' : 'DOWNLOAD RECEIPT'}
          </button>
        </section>

        <section className="fl-photo">
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            onChange={handleGallerySelection}
            style={{ display: 'none' }}
            aria-label="Choose a photo from your gallery"
          />

          {phase === 'live' && (
            <>
              <div className="fl-photo__frame">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className="fl-photo__video"
                />
              </div>

              <div className="fl-photo__row" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                <button type="button" className="fl-btn fl-btn--rose" onClick={takePhoto}>
                  <Camera size={20} /> Take photo
                </button>
                <button type="button" className="fl-btn fl-btn--soft" onClick={openGallery}>
                  <ImagePlus size={20} /> Open gallery
                </button>
                <button type="button" className="fl-btn fl-btn--soft" onClick={removePhoto}>
                  Cancel
                </button>
              </div>
            </>
          )}

          {(phase === 'preview' || phase === 'saving') && (
            <>
              <div className="fl-photo__frame">
                <img src={previewUrl} alt="Delivery proof photo preview" className="fl-photo__video" />
              </div>

              <p style={{ color: '#684854', textAlign: 'center', fontWeight: 700 }}>
                Happy with your photo? Save it to continue, or change it.
              </p>

              <div className="fl-photo__row" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                <button type="button" className="fl-btn fl-btn--soft" onClick={retake} disabled={phase === 'saving'}>
                  <RefreshCw size={18} /> Retake
                </button>
                <button type="button" style={{ ...actionStyle, background: '#FFFFFF', color: '#684854' }} onClick={openGallery} disabled={phase === 'saving'}>
                  <ImagePlus size={18} /> Choose another
                </button>
                <button type="button" style={{ ...actionStyle, background: '#FFF0F2', color: '#A34455' }} onClick={removePhoto} disabled={phase === 'saving'}>
                  <Trash2 size={18} /> Remove photo
                </button>
                <button type="button" className="fl-btn fl-btn--rose" onClick={savePhoto} disabled={phase === 'saving'}>
                  <CheckCircle2 size={20} /> {phase === 'saving' ? 'Saving...' : 'Save and continue'}
                </button>
              </div>
            </>
          )}

          {(phase === 'idle' || phase === 'error') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', width: '100%' }}>
              <button type="button" className="fl-btn fl-btn--rose" onClick={startCamera}>
                <Camera size={20} /> Open camera
              </button>
              <button type="button" style={{ ...actionStyle, background: '#FFFFFF', color: '#684854', width: '100%', maxWidth: '320px' }} onClick={openGallery}>
                <ImagePlus size={20} /> Open gallery
              </button>
            </div>
          )}

          {message && (
            <p className="fl-photo__error" role="status" style={{ overflowWrap: 'anywhere' }}>
              {message}
            </p>
          )}
        </section>
      </div>
    </div>
  );
};

export default PhotoProofPage;
