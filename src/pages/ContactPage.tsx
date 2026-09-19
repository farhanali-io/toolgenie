import React, { useState } from 'react';
import { SEOHead } from '../components/SEOHead';
import { Mail, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

// ============================================================================
// TODO: REPLACE WITH YOUR OWN FREE WEB3FORMS ACCESS KEY (register with farhanaly.io3@gmail.com)
// Get your key at https://web3forms.com — submissions will route to farhanaly.io3@gmail.com
// ============================================================================
const WEB3FORMS_ACCESS_KEY = "YOUR_WEB3FORMS_ACCESS_KEY_HERE";

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Your name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Your email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Please enter your message';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message should be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          name: formData.name.trim(),
          email: formData.email.trim(),
          message: formData.message.trim(),
          from_name: 'ToolGenie Web Visitor',
          subject: `ToolGenie Message from ${formData.name.trim()}`
        })
      });

      const result = await response.json();

      if (response.status === 200 || result.success) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', message: '' });
        setErrors({});
      } else {
        // If placeholder access key is used or API returned error
        if (WEB3FORMS_ACCESS_KEY === "YOUR_WEB3FORMS_ACCESS_KEY_HERE") {
          // Provide friendly notification about key configuration while simulating success/notice
          setSubmitStatus('error');
          setErrorMessage(result.message || 'Web3Forms Access Key is pending configuration. You can also email farhanaly.io3@gmail.com directly.');
        } else {
          setSubmitStatus('error');
          setErrorMessage(result.message || 'Submission failed. Please try again or email us directly.');
        }
      }
    } catch (err) {
      setSubmitStatus('error');
      setErrorMessage('Network connection error. Please verify your internet or contact farhanaly.io3@gmail.com directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <SEOHead
        title="Contact Us — ToolGenie"
        description="Have a question, suggestion, or found a bug? Get in touch with the ToolGenie team."
        canonicalUrl="https://toolgenie.online/contact"
      />

      <header className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3 border"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--accent)'
          }}
        >
          <Mail size={14} />
          <span>Feedback & Support</span>
        </div>

        <h1 
          className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight mb-3"
          style={{ color: 'var(--text-primary)' }}
        >
          Get in Touch
        </h1>

        <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Have a question, suggestion, or found a bug? We&apos;d love to hear from you.
        </p>
      </header>

      <div 
        className="rounded-2xl border p-6 sm:p-8"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04)'
        }}
      >
        {/* Success Banner */}
        {submitStatus === 'success' && (
          <div 
            className="p-4 rounded-xl border mb-6 flex items-start gap-3 bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
            role="alert"
          >
            <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
            <p className="text-sm font-medium">
              Thanks! Your message has been sent. We&apos;ll get back to you soon.
            </p>
          </div>
        )}

        {/* Error Banner */}
        {submitStatus === 'error' && (
          <div 
            className="p-4 rounded-xl border mb-6 flex items-start gap-3 bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
            role="alert"
          >
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold mb-0.5">Message could not be delivered</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* The 3 Required Fields Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Field 1: Your Name */}
          <div>
            <label 
              htmlFor="contact-name" 
              className="block text-xs font-bold uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--text-primary)' }}
            >
              Your Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="contact-name"
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              placeholder="e.g. Alex Morgan"
              className="w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: errors.name ? '#ef4444' : 'var(--border-strong)',
                color: 'var(--text-primary)'
              }}
            />
            {errors.name && (
              <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                <span>{errors.name}</span>
              </p>
            )}
          </div>

          {/* Field 2: Your Email */}
          <div>
            <label 
              htmlFor="contact-email" 
              className="block text-xs font-bold uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--text-primary)' }}
            >
              Your Email <span className="text-rose-500">*</span>
            </label>
            <input
              id="contact-email"
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: errors.email ? '#ef4444' : 'var(--border-strong)',
                color: 'var(--text-primary)'
              }}
            />
            {errors.email && (
              <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                <span>{errors.email}</span>
              </p>
            )}
          </div>

          {/* Field 3: Your Message */}
          <div>
            <label 
              htmlFor="contact-message" 
              className="block text-xs font-bold uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--text-primary)' }}
            >
              Your Message <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="contact-message"
              name="message"
              required
              rows={5}
              value={formData.message}
              onChange={(e) => {
                setFormData({ ...formData, message: e.target.value });
                if (errors.message) setErrors({ ...errors, message: undefined });
              }}
              placeholder="Describe your suggestion, tool request, or feedback..."
              className="w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none resize-y"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: errors.message ? '#ef4444' : 'var(--border-strong)',
                color: 'var(--text-primary)'
              }}
            />
            {errors.message && (
              <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                <span>{errors.message}</span>
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            id="contact-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-6 rounded-xl font-heading font-bold text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-contrast)'
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Sending Message...</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>Send Message</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t text-center text-xs" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
          Direct inquiries can also be sent to{' '}
          <a 
            href="mailto:farhanaly.io3@gmail.com" 
            className="font-medium hover:underline"
            style={{ color: 'var(--accent)' }}
          >
            farhanaly.io3@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
};
