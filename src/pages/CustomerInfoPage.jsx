import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { FloralCorner } from '../components/Decorations';
import { scrollToTop } from '../utils/scrollToTop';
import { User, Mail, Phone, ArrowRight, AlertTriangle } from 'lucide-react';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FIELDS = [
  {
    key: 'name',
    label: 'Name',
    type: 'text',
    placeholder: 'Your full name',
    Icon: User,
    autoComplete: 'name',
    inputMode: 'text',
    maxLength: 100
  },
  {
    key: 'email',
    label: 'Email',
    type: 'email',
    placeholder: 'name@email.com',
    Icon: Mail,
    autoComplete: 'email',
    inputMode: 'email',
    maxLength: 254
  },
  {
    key: 'phone',
    label: 'Phone Number',
    type: 'tel',
    placeholder: '09XX XXX XXXX',
    Icon: Phone,
    autoComplete: 'tel',
    inputMode: 'tel',
    maxLength: 30
  }
];

const validate = (values) => {
  const errors = {};

  if (!values.name.trim()) {
    errors.name = 'Please enter your name.';
  }

  if (!values.email.trim()) {
    errors.email = 'Please enter your email address.';
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Please enter a valid email address (example: name@email.com).';
  }

  if (!values.phone.trim()) {
    errors.phone = 'Please enter your phone number.';
  }

  return errors;
};

export const CustomerInfoPage = ({ initialValues, onBack, onContinue }) => {
  const [values, setValues] = useState({
    name: initialValues?.name || '',
    email: initialValues?.email || '',
    phone: initialValues?.phone || ''
  });
  const [errors, setErrors] = useState({});
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    scrollToTop();
  }, []);

  const handleChange = (key) => (e) => {
    const next = { ...values, [key]: e.target.value };
    setValues(next);
    // After the first attempt, keep messages up to date while typing
    if (attempted) {
      setErrors(validate(next));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setAttempted(true);

    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    onContinue({
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      section: 'N/A'
    });
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        position: 'relative',
        paddingBottom: '72px'
      }}
    >
      <FloralCorner position="top-left" />
      <FloralCorner position="top-right" />

      <Header title="CUSTOMER INFO" onBack={onBack} showCart={false} />

      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '820px',
          margin: '0 auto',
          padding: '8px 24px',
          zIndex: 10
        }}
      >
        <form
          className="stitch-panel"
          noValidate
          onSubmit={handleSubmit}
          style={{
            padding: '32px 36px',
            display: 'flex',
            flexDirection: 'column',
            gap: '22px'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '2rem',
                fontWeight: 800,
                color: '#0d2547',
                marginBottom: '6px'
              }}
            >
              Tell us about you
            </h2>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#3b5a82' }}>
              All three fields are required.
            </p>
          </div>

          {attempted && hasErrors && (
            <div className="checkout-banner" role="alert">
              <AlertTriangle size={24} style={{ flexShrink: 0 }} />
              <span>Please complete all required fields correctly to continue.</span>
            </div>
          )}

          {FIELDS.map((field) => {
            const Icon = field.Icon;
            const fieldError = errors[field.key];
            const inputId = `checkout-${field.key}`;

            return (
              <div className="checkout-field" key={field.key}>
                <label className="checkout-label" htmlFor={inputId}>
                  {field.label}
                </label>
                <div className="checkout-input-wrap">
                  <span className="checkout-input-icon">
                    <Icon size={26} />
                  </span>
                  <input
                    id={inputId}
                    className={`checkout-input${fieldError ? ' has-error' : ''}`}
                    type={field.type}
                    inputMode={field.inputMode}
                    autoComplete={field.autoComplete}
                    autoCapitalize={field.key === 'email' ? 'none' : 'words'}
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength={field.maxLength}
                    placeholder={field.placeholder}
                    value={values[field.key]}
                    onChange={handleChange(field.key)}
                    aria-invalid={fieldError ? 'true' : 'false'}
                    aria-describedby={fieldError ? `${inputId}-error` : undefined}
                  />
                </div>
                {fieldError && (
                  <div className="checkout-error" id={`${inputId}-error`} role="alert">
                    <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                    <span>{fieldError}</span>
                  </div>
                )}
              </div>
            );
          })}

          <Button
            type="submit"
            variant="accent"
            size="xl"
            className="checkout-btn-full"
            icon={<ArrowRight size={26} />}
          >
            CONTINUE TO PAYMENT
          </Button>
        </form>
      </main>
    </div>
  );
};
