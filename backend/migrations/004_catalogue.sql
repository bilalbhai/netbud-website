begin;
-- Advertised prices preserved. All products INACTIVE until scope/tax review.
insert into netbud.products(id,slug,name,price_cents,physical,sale_mode) values
(10,'nfc-google-review-card','NFC Google Review Card',3900,true,'hybrid'),
(5,'custom-nfc-business-card','Custom NFC Business Card',3900,true,'hybrid'),
(4,'professional-logo-design','Professional Logo Design',7900,false,'quote'),
(11,'landing-page','Landing Page',29900,false,'quote'),
(12,'portfolio-website','Portfolio Website',39900,false,'quote'),
(1,'business-website','Business Website',59900,false,'quote'),
(13,'ecommerce-website','E-commerce Website',149900,false,'quote'),
(14,'website-redesign','Website Redesign',39900,false,'quote'),
(15,'google-business-profile-setup','Google Business Profile Setup',9900,false,'quote'),
(16,'google-business-profile-management','Google Business Profile Management',9900,false,'quote'),
(2,'seo-setup-optimisation','SEO Setup & Optimisation',19900,false,'quote'),
(17,'monthly-seo-management','Monthly SEO Management',29900,false,'quote'),
(7,'social-media-content-management','Social Media Content & Management',29900,false,'quote'),
(18,'business-analytics-tracking-setup','Business Analytics & Tracking Setup',14900,false,'quote'),
(19,'domain-professional-email-setup','Domain & Professional Email Setup',9900,false,'quote'),
(3,'website-hosting-care','Website Hosting & Care',4900,false,'quote'),
(6,'online-booking-system-setup','Online Booking System Setup',14900,false,'quote'),
(20,'digital-invoicing-system-setup','Digital Invoicing System Setup',14900,false,'quote');
commit;
