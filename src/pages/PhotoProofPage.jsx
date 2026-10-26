
import React, { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, Trash2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { supabase } from '../services/supabase';
import '../styles/confirmation.css';

const BUCKET = 'order-proofs';
const MAX_WIDTH = 1024;
const MAX_FILE_SIZE = 15 * 1024 * 1024;

export const PhotoProofPage = ({ order, onDone }) => {
  // idle | live | preview | saving | error
  const [phase, setPhase] = useState('idle');
  const [message, setMessage] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const blobRef = useRef(null);
  const galleryRef = useRef(null);
  const previewUrlRef = useRef('');

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

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
        setMessage('Could not start the camera preview. Please try again.');
      });
    }
  }, [phase]);

  const startCamera = async () => {
    setMessage('');

    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage(
        'Camera access is unavailable. Please use Open Gallery or check your browser permissions.'
      );
      setPhase('error');
      return;
    }

    try {
      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 960 }
        },
        audio: false
      });

      streamRef.current = stream;
      setPhase('live');
    } catch (error) {
      console.error('Camera access failed:', error);

      setMessage(
        'Camera access was blocked. Allow camera permission or choose a photo from your gallery.'
      );
      setPhase('error');
    }
  };

  const takePhoto = () => {
    const video = videoRef.current;

    if (!video || !video.videoWidth) {
      setMessage('The camera is not ready yet. Please try again.');
      return;
    }

    const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
    const width = Math.round(video.videoWidth * scale);
    const height = Math.round(video.videoHeight * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');

    if (!context) {
      setMessage('Could not process the photo. Please try again.');
      return;
    }

    // Mirror the photo to match the front-camera preview.
    context.translate(width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, width, height);

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

  const handleGallerySelection = async (event) => {
    const file = event.target.files?.[0];

    // Allow the same photo to be selected again later.
    event.target.value = '';

    if (!file) return;

    setMessage('');

    if (!file.type.startsWith('image/')) {
      setMessage('Please select an image file.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setMessage('This photo is too large. Please choose an image under 15 MB.');
      return;
    }

    try {
      stopCamera();

      const image = new Image();
      const temporaryUrl = URL.createObjectURL(file);

      image.onload = () => {
        try {
          const scale = Math.min(1, MAX_WIDTH / image.naturalWidth);
          const width = Math.round(image.naturalWidth * scale);
          const height = Math.round(image.naturalHeight * scale);

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const context = canvas.getContext('2d');

          if (!context) {
            throw new Error('Could not process the selected image.');
          }

          context.drawImage(image, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(temporaryUrl);

              if (!blob) {
                setMessage('Could not process this photo. Please choose another one.');
                return;
              }

              showPreview(blob);
            },
            'image/jpeg',
            0.85
          );
        } catch (error) {
          URL.revokeObjectURL(temporaryUrl);
          console.error('Gallery image processing failed:', error);
          setMessage('Could not process this photo. Please choose another one.');
        }
      };

      image.onerror = () => {
        URL.revokeObjectURL(temporaryUrl);
        setMessage('Could not open this image. Please choose another one.');
      };

      image.src = temporaryUrl;
    } catch (error) {
      console.error('Gallery selection failed:', error);
      setMessage('Could not load the selected photo. Please try again.');
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
    if (!blobRef.current || !order?.order_number || phase === 'saving') {
      return;
    }

    if (!supabase) {
      setMessage('Supabase is not configured.');
      return;
    }

    setPhase('saving');
    setMessage('');

    try {
      const fileName =
        `${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, blobRef.current, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: saved, error: rpcError } = await supabase.rpc(
        'save_order_proof',
        {
          p_order_number: order.order_number,
          p_path: fileName
        }
      );

      if (rpcError || saved === false) {
        throw rpcError || new Error('Could not link the photo to your order.');
      }

      const { data } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(fileName);

      onDone(data.publicUrl);
    } catch (error) {
      console.error('Saving order proof failed:', error);

      setMessage(
        error?.message || 'Could not save your photo. Please try again.'
      );
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
    border: '1px solid #E8C7D1'
  };

  return (
    <div className="fl-done">
      <div className="fl-done__card">
        <h1 className="fl-done__title">One last step</h1>

        <p className="fl-done__lead">
          Please take a photo of yourself with your flowers, or choose a
          picture from your gallery. Your photo will be saved as proof of
          delivery and can be viewed later in Track My Order.
        </p>

        {order?.order_number && (
          <p className="fl-done__hint">
            Order {order.order_number}
          </p>
        )}

        <section className="fl-photo">
          {/* Hidden image picker */}
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            onChange={handleGallerySelection}
            style={{ display: 'none' }}
            aria-label="Choose a photo from your gallery"
          />

          {/* Camera preview */}
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
                style={{ flexWrap: 'wrap', justifyContent: 'center' }}
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

          {/* Selected photo preview */}
          {(phase === 'preview' || phase === 'saving') && (
            <>
              <div className="fl-photo__frame">
                <img
                  src={previewUrl}
                  alt="Preview of your delivery proof photo"
                  className="fl-photo__video"
                />
              </div>

              <p
                style={{
                  color: '#684854',
                  textAlign: 'center',
                  fontWeight: 700,
                  margin: '12px 0'
                }}
              >
                Happy with your photo? Save it to continue, or change it.
              </p>

              <div
                className="fl-photo__row"
                style={{ flexWrap: 'wrap', justifyContent: 'center' }}
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
                    color: '#684854'
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
                    borderColor: '#F0C8D0'
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

          {/* Initial screen or camera error */}
          {(phase === 'idle' || phase === 'error') && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                alignItems: 'center',
                width: '100%'
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
                  maxWidth: '320px'
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
              role="alert"
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
