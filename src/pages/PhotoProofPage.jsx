
import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  ImagePlus,
  Trash2,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { supabase } from '../services/supabase';
import '../styles/confirmation.css';

const BUCKET = 'order-proofs';
const MAX_WIDTH = 1024;
const MAX_FILE_SIZE = 15 * 1024 * 1024;

export const PhotoProofPage = ({ order, onDone }) => {
  const [phase, setPhase] = useState('idle');
  const [message, setMessage] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const blobRef = useRef(null);
  const galleryRef = useRef(null);
  const previewUrlRef = useRef('');

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
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

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (phase === 'live' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;

      videoRef.current.play().catch(() => {
        setMessage(
          'Camera preview failed. Please choose a photo from your gallery.'
        );
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

      setMessage(
        'Camera permission was blocked. Please choose a photo from your gallery.'
      );

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

    // Mirror the selfie camera image.
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setMessage('Could not create the photo. Please try again.');
          return;
        }

        stopCamera();
        showPreview(blob);
      },
      'image/jpeg',
      0.85
    );
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

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(temporaryUrl);

          if (!blob) {
            setMessage('Could not process this image.');
            return;
          }

          showPreview(blob);
        },
        'image/jpeg',
        0.85
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(temporaryUrl);
      setMessage('Could not open this image.');
    };

    image.src = temporaryUrl;
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
      setMessage(
        'Please take a photo or choose one from your gallery first.'
      );
      return;
    }

    const orderNumber = order?.order_number || order?.orderNumber;

    if (!orderNumber) {
      setMessage('Order number is missing. Please contact staff.');
      return;
    }

    if (!supabase) {
      setMessage('Supabase is not configured. Please contact staff.');
      return;
    }

    setPhase('saving');
    setMessage('');

    try {
      const fileName = `${
        globalThis.crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random().toString(36).slice(2)}`
      }.jpg`;

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
          p_order_number: orderNumber,
          p_path: fileName,
        }
      );

      if (rpcError) throw rpcError;

      if (saved === false) {
        throw new Error('Could not link the photo to your order.');
      }

      const { data } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(fileName);

      if (!data?.publicUrl) {
        throw new Error('Could not retrieve the saved photo URL.');
      }

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
        <h1 className="fl-done__title">Photo Proof</h1>

        <p className="fl-done__lead">
          Take a photo with your flowers or choose one from your gallery
          to continue with your order.
        </p>

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

              <div
                className="fl-photo__row"
                style={{
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                <button
                  type="button"
                  className="fl-btn fl-btn--rose"
                  onClick={takePhoto}
                >
                  <Camera size={20} />
                  Take photo
                </button>

                <button
                  type="button"
                  className="fl-btn fl-btn--soft"
                  onClick={openGallery}
                >
                  <ImagePlus size={20} />
                  Open gallery
                </button>

                <button
                  type="button"
                  className="fl-btn fl-btn--soft"
                  onClick={removePhoto}
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {(phase === 'preview' || phase === 'saving') && (
            <>
              <div className="fl-photo__frame">
                <img
                  src={previewUrl}
                  alt="Delivery proof photo preview"
                  className="fl-photo__video"
                />
              </div>

              <p
                style={{
                  color: '#684854',
                  textAlign: 'center',
                  fontWeight: 700,
                }}
              >
                Happy with your photo? Save it to continue, or change it.
              </p>

              <div
                className="fl-photo__row"
                style={{
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                <button
                  type="button"
                  className="fl-btn fl-btn--soft"
                  onClick={retake}
                  disabled={phase === 'saving'}
                >
                  <RefreshCw size={18} />
                  Retake
                </button>

                <button
                  type="button"
                  style={{
                    ...actionStyle,
                    background: '#FFFFFF',
                    color: '#684854',
                  }}
                  onClick={openGallery}
                  disabled={phase === 'saving'}
                >
                  <ImagePlus size={18} />
                  Choose another
                </button>

                <button
                  type="button"
                  style={{
                    ...actionStyle,
                    background: '#FFF0F2',
                    color: '#A34455',
                  }}
                  onClick={removePhoto}
                  disabled={phase === 'saving'}
                >
                  <Trash2 size={18} />
                  Remove photo
                </button>

                <button
                  type="button"
                  className="fl-btn fl-btn--rose"
                  onClick={savePhoto}
                  disabled={phase === 'saving'}
                >
                  <CheckCircle2 size={20} />
                  {phase === 'saving' ? 'Saving...' : 'Save and continue'}
                </button>
              </div>
            </>
          )}

          {(phase === 'idle' || phase === 'error') && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <button
                type="button"
                className="fl-btn fl-btn--rose"
                onClick={startCamera}
              >
                <Camera size={20} />
                Open camera
              </button>

              <button
                type="button"
                style={{
                  ...actionStyle,
                  background: '#FFFFFF',
                  color: '#684854',
                  width: '100%',
                  maxWidth: '320px',
                }}
                onClick={openGallery}
              >
                <ImagePlus size={20} />
                Open gallery
              </button>
            </div>
          )}

          {message && (
            <p
              className="fl-photo__error"
              role="status"
              style={{ overflowWrap: 'anywhere' }}
            >
              {message}
            </p>
          )}
        </section>
      </div>
    </div>
  );
};

export default PhotoProofPage;
