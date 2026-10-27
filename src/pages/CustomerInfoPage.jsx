import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { scrollToTop } from '../utils/scrollToTop';
import { User, Mail, Phone, AlertTriangle } from 'lucide-react';
import '../styles/light.css';
import '../styles/customer-info.css';

const EMAIL_PATTERN =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;

const NAME_PATTERN = /^\p{L}+(?:[ '-]\p{L}+)*$/u;
const PHONE_PATTERN = /^09\d{9}$/;

const COMMON_GMAIL_TYPOS = [
  'gmai.com', 'gmial.com', 'gamil.com', 'gmal.com',
  'gmail.con', 'gmail.co', 'gmail.om', 'gmail.comm',
  'gmaill.com', 'gmail.cmo', 'gmil.com', 'g-mail.com',
];

const FIELDS = [
  {
    key: 'name',
    label: 'Full Name',
    type: 'text',
    placeholder: 'Your full name',
    Icon: User,
    autoComplete: 'name',
    inputMode: 'text',
    maxLength: 20,
  },
  {
  key: 'email',
  label: 'Email Address',
  type: 'email',
  placeholder: 'name@gmail.com',
  Icon: Mail,
  autoComplete: 'email',
  inputMode: 'email',
  maxLength: 40,
},
  {
    key: 'phone',
    label: 'Phone Number',
    type: 'tel',
    placeholder: '09XXXXXXXXX',
    Icon: Phone,
    autoComplete: 'tel',
    inputMode: 'numeric',
    maxLength: 11,
  },
];

const capitalizeName = (value) =>
  value
    .toLocaleLowerCase()
    .replace(/(^|[ '-])(\p{L})/gu, (_, separator, letter) =>
      separator + letter.toLocaleUpperCase()
    );

const normalizeName = (value) =>
  capitalizeName(
    value
      .replace(/[^\p{L} '-]/gu, '')
      .replace(/\s{2,}/g, ' ')
  );

const getEmailError = (value) => {
  const email = value.trim();

  if (!email) return 'Please enter your email address.';
  if (/\s/.test(email)) {
    return 'Your email address must not contain spaces.';
  }
  if (!EMAIL_PATTERN.test(email)) {
    return 'Please enter a valid email address.';
  }

  const domain = email.split('@')[1]?.toLowerCase();

  if (COMMON_GMAIL_TYPOS.includes(domain)) {
    return 'Did you mean gmail.com? Please check your email.';
  }

  return '';
};

const validate = (values) => {
  const errors = {};
  const name = values.name.trim();
  const email = values.email.trim();
  const phone = values.phone.trim();

  if (!name) {
    errors.name = 'Please enter your full name.';
  } else if (name.length < 2) {
    errors.name = 'Your name must contain at least 2 characters.';
  } else if (name.length > 20) {
    errors.name = 'Your name cannot exceed 20 characters.';
  } else if (!NAME_PATTERN.test(name)) {
    errors.name = 'Use letters, spaces, hyphens, or apostrophes only.';
  }

  if (!email) {
    errors.email = 'Please enter your email address.';
 } else if (email.length > 40) {
  errors.email = 'Your email cannot exceed 40 characters.';
  } else {
    const emailError = getEmailError(email);
    if (emailError) errors.email = emailError;
  }

  if (!phone) {
    errors.phone = 'Please enter your phone number.';
  } else if (!/^09/.test(phone)) {
    errors.phone = 'Your number must start with 09.';
  } else if (!/^\d+$/.test(phone)) {
    errors.phone = 'Your phone number must contain digits only.';
  } else if (!PHONE_PATTERN.test(phone)) {
    errors.phone = 'Enter exactly 11 digits, starting with 09.';
  }

  return errors;
};

export const CustomerInfoPage = ({ initialValues, onBack, onContinue }) => {
  const [values, setValues] = useState({
    name: normalizeName((initialValues?.name || '').slice(0, 20)),
    email: (initialValues?.email || '').replace(/\s/g, '').slice(0, 40),
    phone: (initialValues?.phone || '').replace(/\D/g, '').slice(0, 11),
  });

  const [errors, setErrors] = useState({});
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    scrollToTop();
  }, []);

  const handleChange = (key) => (event) => {
    let value = event.target.value;

    if (key === 'name') value = normalizeName(value).slice(0, 20);
   if (key === 'email') value = value.replace(/\s/g, '').slice(0, 40);
    if (key === 'phone') value = value.replace(/\D/g, '').slice(0, 11);

    const nextValues = { ...values, [key]: value };
    setValues(nextValues);

    if (attempted) setErrors(validate(nextValues));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setAttempted(true);

    const foundErrors = validate(values);
    setErrors(foundErrors);

    if (Object.keys(foundErrors).length > 0) return;

    if (typeof onContinue !== 'function') {
      console.error('CustomerInfoPage: onContinue callback is missing.');
      return;
    }

    onContinue({
      name: capitalizeName(values.name.trim()),
      email: values.email.trim(),
      phone: values.phone.trim(),
      section: 'N/A',
    });
  };

  const hasErrors = Object.values(errors).some(Boolean);

  return (
    <div className="fl-light fl-page customer-info-page">
      <Header />

      <main className="customer-info-container">
        <section className="customer-info-card">
          <div className="customer-info-heading">
            <span className="customer-info-eyebrow">YOUR DETAILS</span>
            <h1>Let's get to know you</h1>
            <p>
              Enter your contact information so we can prepare your flower order.
            </p>
          </div>

          {hasErrors && attempted && (
            <div className="customer-info-banner" role="alert">
              <AlertTriangle size={19} />
              <span>Please check the highlighted fields before continuing.</span>
            </div>
          )}

          <form className="customer-info-form" onSubmit={handleSubmit} noValidate>
            {FIELDS.map(({ key, label, type, placeholder, Icon, autoComplete, inputMode, maxLength }) => {
              const fieldError = errors[key];

              return (
                <div className="customer-info-field" key={key}>
                  <label htmlFor={`customer-${key}`}>{label}</label>

                  <div className={`customer-info-input-wrap ${fieldError ? 'has-error' : ''}`}>
                    <Icon
                      className="customer-info-input-icon"
                      size={20}
                      aria-hidden="true"
                    />
                    <input
                      id={`customer-${key}`}
                      name={key}
                      type={type}
                      value={values[key]}
                      onChange={handleChange(key)}
                      placeholder={placeholder}
                      autoComplete={autoComplete}
                      inputMode={inputMode}
                      maxLength={maxLength}
                      aria-invalid={Boolean(fieldError)}
                      aria-describedby={
                        fieldError ? `customer-${key}-error` : `customer-${key}-hint`
                      }
                    />
                  </div>

                  {key === 'name' && !fieldError && (
                    <p className="customer-info-hint" id="customer-name-hint">
                      Name is limited to 20 characters. Capitalization is applied automatically.
                    </p>
                  )}

                  {key === 'email' && !fieldError && (
                   <p className="customer-info-hint" id="customer-email-hint">
  Maximum 40 characters. Use an email address you can access.
</p>
                  )}

                  {key === 'phone' && !fieldError && (
                    <p className="customer-info-hint" id="customer-phone-hint">
                      Enter 11 digits, starting with 09.
                    </p>
                  )}

                  {fieldError && (
                    <p className="customer-info-error" id={`customer-${key}-error`} role="alert">
                      <AlertTriangle size={15} aria-hidden="true" />
                      {fieldError}
                    </p>
                  )}
                </div>
              );
            })}

            <div className="customer-info-actions">
              {typeof onBack === 'function' && (
                <Button type="button" variant="secondary" onClick={onBack}>
                  Back
                </Button>
              )}

              <Button
                type="submit"
                variant="primary"
                className="customer-info-continue-btn"
              >
                Continue
              </Button>
            </div>
          </form>

          <p className="customer-info-footer">
            Your information will be used to process your order.
          </p>
        </section>
      </main>
    </div>
  );
};

export default CustomerInfoPage;
