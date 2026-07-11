// ===================== GOOGLE ANALYTICS 4 =====================
// Replace G-XXXXXXXXXX with your real GA4 Measurement ID
// Get it from: analytics.google.com → Admin → Data Streams → your stream
(function(){
  const GA_ID = window.LOUD_GA_ID || 'G-LK9HCYS3C9';
  if(GA_ID === 'G-XXXXXXXXXX') return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_ID, {
    page_title: document.title,
    page_location: window.location.href,
  });

  // Track checkout button clicks as conversion events
  document.querySelectorAll('[data-checkout]').forEach(btn => {
    btn.addEventListener('click', () => {
      gtag('event', 'begin_checkout', {
        currency: 'USD',
        value: parseInt(btn.dataset.priceCents || 0) / 100,
        items: [{ item_name: btn.dataset.serviceName || 'Service' }]
      });
    });
  });

  // Track contact form submissions
  const contactForm = document.getElementById('contactForm');
  if(contactForm){
    contactForm.addEventListener('submit', () => {
      gtag('event', 'generate_lead', { event_category: 'contact_form' });
    });
  }

  // Track booking form submissions
  const bookingForm = document.getElementById('bookingForm');
  if(bookingForm){
    bookingForm.addEventListener('submit', () => {
      gtag('event', 'generate_lead', { event_category: 'booking_form' });
    });
  }
})();
