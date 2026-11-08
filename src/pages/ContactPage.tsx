import { MapPin, Phone, Mail } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export const ContactPage = () => {
  const { t, language } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message?: string }>({ type: 'idle' });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus({ type: 'idle' });
    if (!name.trim() || !email.trim() || !phone.trim() || !message.trim()) {
      setStatus({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }
    setSubmitting(true);
    try {
      if (!supabase) throw new Error('Supabase not configured');
      const { error } = await supabase.from('service_appointments').insert([{
        customer_name: name,
        phone,
        notes: `${email}: ${message}`,
        service_type: 'general_inquiry',
        preferred_date: new Date().toISOString().slice(0, 10)
      }]);
      if (error) {
        console.warn('Supabase insert failed', error);
        setStatus({ type: 'error', message: 'Could not send your message. Please try again.' });
        return;
      }
      setStatus({ type: 'success', message: 'Thanks, we received your message.' });
      try { (await import('../lib/analytics')).trackEvent('contact_submitted', { name, email }); } catch { /* analytics is non-critical */ }
      setName(''); setEmail(''); setPhone(''); setMessage('');
    } catch (err) {
      console.warn('Could not send the message:', err);
      setStatus({ type: 'error', message: 'Submission failed. Please try again later.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card pb-10 pt-28 sm:pb-12 md:pb-14">
        <div className="container-fluid">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {language === 'en' ? 'Contact' : 'যোগাযোগ'}
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            {t('contact.title')}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
            {language === 'en' ? 'Visit our showroom or get in touch with us' : 'আমাদের শোরুম পরিদর্শন করুন বা আমাদের সাথে যোগাযোগ করুন'}
          </p>
        </div>
      </header>

      <div className="container-fluid py-10 md:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-10 md:mb-12">
            <Card className="p-6 text-center">
              <MapPin className="mx-auto mb-4 h-10 w-10 text-primary sm:h-11 sm:w-11" />
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                AutoSpark
              </h3>
              <p className={`text-sm sm:text-base text-muted-foreground`}>Station Road, Near Shuvo Petroleum, Sheroil, Ghoramara, Boalia Rajshahi, Rajshahi, Bangladesh, 6207</p>
              <p className={`text-xs text-muted-foreground/70`}>Rajshahi, Rajshahi Division, Bangladesh</p>
            </Card>
            <Card className="p-6 text-center">
              <MapPin className="mx-auto mb-4 h-10 w-10 text-primary sm:h-11 sm:w-11" />
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                Auto Spark Service Center
              </h3>
              <p className={`text-sm sm:text-base text-muted-foreground`}>Meherchandi, West Side of School Mor, Rajshahi, Rajshahi, Bangladesh, 6202</p>
              <p className={`text-xs text-muted-foreground/70`}>Rajshahi, Rajshahi Division, Bangladesh</p>
            </Card>
            <Card className="p-6 text-center">
              <Phone className="mx-auto mb-4 h-10 w-10 text-primary sm:h-11 sm:w-11" />
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {language === 'en' ? 'Call Us' : 'কল করুন'}
              </h3>
              <div className="flex flex-col gap-1">
                <a href={`tel:+8801760401605`} className="text-primary hover:text-primary/80 text-sm sm:text-base font-semibold">Showroom: +880 1760-401605</a>
                <a href={`tel:+8801321233670`} className="text-primary hover:text-primary/80 text-sm sm:text-base font-semibold">Service Center: +880 1321-233670</a>
              </div>
            </Card>
            <Card className="p-6 text-center sm:col-span-2 lg:col-span-1">
              <Mail className="mx-auto mb-4 h-10 w-10 text-primary sm:h-11 sm:w-11" />
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {language === 'en' ? 'Email Us' : 'ইমেইল করুন'}
              </h3>
              <div className="flex flex-col gap-1">
                <a href="mailto:autosparkbd@gmail.com" className="text-primary hover:text-primary/80 text-sm sm:text-base font-semibold break-all">Showroom: autosparkbd@gmail.com</a>
                <a href="mailto:autosparkbd@gmail.com" className="text-primary hover:text-primary/80 text-sm sm:text-base font-semibold break-all">Service Center: autosparkbd@gmail.com</a>
              </div>
            </Card>
          </div>
        </div>

        <div className="container-fluid pb-12">
          <div className="max-w-2xl mx-auto">
            <Card className="p-6 md:p-8">
            <h2 className="mb-5 text-xl font-semibold text-foreground sm:text-2xl">
              {language === 'en' ? 'Send us a Message' : 'আমাদের একটি বার্তা পাঠান'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {status.type !== 'idle' && (
                <div role="alert" className={`p-3 rounded-lg ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-destructive/10 text-destructive'}`}>
                  {status.message}
                </div>
              )}
              <div>
                <label htmlFor="contact-name" className="mb-2 block text-sm font-medium text-foreground">
                  {t('form.name')} *
                </label>
                <input
                  id="contact-name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  required
                  aria-required="true"
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="mb-2 block text-sm font-medium text-foreground">
                  {t('form.email')} *
                </label>
                <input
                  id="contact-email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  aria-required="true"
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label htmlFor="contact-phone" className="mb-2 block text-sm font-medium text-foreground">
                  {t('form.phone')} *
                </label>
                <input
                  id="contact-phone"
                  name="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                  required
                  aria-required="true"
                  placeholder="01XXXXXXXXX"
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label htmlFor="contact-message" className="mb-2 block text-sm font-medium text-foreground">
                  {t('form.message')} *
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  required
                  aria-required="true"
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? 'Sending…' : t('form.send')}
              </Button>
            </form>
          </Card>
          </div>
        </div>
    </div>
  );
};