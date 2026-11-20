/*
 * NETBUD SETTINGS
 * Edit this file to update shared business details and optional integrations.
 * Never put passwords, secret API keys or private payment credentials here.
 */
window.NETBUD_CONFIG = {
  agencyName: "NetBud",
  tagline: "Your mate for everything digital.",
  supportingTagline: "Websites · Social Media · Advertising · Digital Support",
  contactEmail: "bilal@netbud.com.au",
  phoneNumber: "0425714451",
  phoneDisplay: "0425 714 451",
  whatsappNumber: "61425714451", // International digits only; no + or spaces.
  businessLocation: "67-71 Great Western Highway, Parramatta, NSW 2150",
  serviceAreas: ["Parramatta", "Fairfield", "Liverpool", "Blacktown", "Western Sydney", "Greater Sydney"],
  currency: "AUD", // INR is supported for a separately priced Indian storefront; this does not convert prices.
  locale: "en-AU",
  siteUrl: "https://netbud.com.au", // Add the final HTTPS domain, including a repository path if applicable.
  publicPricing: true,
  launchPricingApproved: true, // Set true only after scope, costs and fulfilment are confirmed.
  pricingNote: "All prices are AUD. Your written quote confirms the scope, final total and any applicable taxes.",
  socialContent: {
    videosPerMonth: 10, // Ten videos in total, prepared for the agreed Reels/TikTok profiles.
    postsPerMonth: null, // Confirm the posting allowance and selected platforms in the proposal.
    dailyHashtagPool: 20, // Curated for the business/content; actual use follows each platform's limits.
    sourceMaterial: "Shop photos and business information from your website",
    platforms: [] // Agreed business profiles; never store account credentials here.
  },
  socialLinks: {
    instagram: "",
    facebook: "",
    linkedin: ""
  },
  formEndpoint: "https://formsubmit.co/ajax/bilal@netbud.com.au",
  formDeliveryVerified: true, // Owner confirmed activation and receipt of a second test enquiry on 17 November 2026.
  googleTagManagerId: "GTM-N9B3W4F5",
  googleAnalyticsId: "G-4L3JN7WC5M", // Owner-confirmed GA4 Measurement ID. GTM is the ONLY loader; release hold pending published-container privacy remediation.
  analyticsEnabled: false, // Release hold: published automatic user-data/form tracking needs correction.
  analyticsContainerReviewed: false, // Published-container privacy review failed on 18 November 2026.
  analyticsAllowedOrigins: ["https://netbud.com.au", "https://www.netbud.com.au"],
  analyticsCampaignAllowlist: {}, // Approved public UTM values only; unknown URL data disables tracking.
  hostedPaymentLinks: [], // Optional [{ label: "Pay an agreed invoice", url: "https://…" }]. Only add genuine links.
  upi: {
    enabled: false,
    id: "",
    qrImage: "", // Local image path for a real, verified recipient QR code.
    instructions: "Use the amount and reference in your agreed invoice. A manual payment is not automatically verified."
  },
  previewTurnaround: "A target of three business days after discovery, subject to eligibility and availability.",
  pricingPlans: [], // Shop catalogue is the source for all entry packages.
  marketingPlans: [],
  portfolio: [
    {
      title: "PACES",
      category: "Client Projects",
      industry: "Disability support",
      status: "Authorised project",
      description: "Disability support website for PACES in Western Sydney. Clear service pages, welcoming content and straightforward enquiry pathways.",
      services: ["Website design", "Service information", "Enquiry pathways"],
      image: "images/portfolio-paces.jpg",
      imageAlt: "The PACES disability support website, shown with permission",
      url: "https://bilalbhai.github.io/paces-website/paces-website/index.html",
      linkLabel: "View PACES website",
      demonstration: false
    },
    {
      title: "A local café, online",
      category: "Website Concepts",
      industry: "Hospitality · fictional concept",
      status: "Fictional demonstration",
      description: "An original café concept exploring a welcoming menu, useful opening information and a simple booking journey. Created to demonstrate design possibilities.",
      services: ["Website concept", "Menu presentation", "Booking layout"],
      image: "images/demo-cafe.webp",
      imageAlt: "Clearly labelled fictional café website concept",
      url: "previews/index.html#cafe",
      linkLabel: "Explore the concept",
      demonstration: true
    },
    {
      title: "A better first call",
      category: "Website Concepts",
      industry: "Local trades · fictional concept",
      status: "Fictional demonstration",
      description: "A local trades concept with clear service information and an easy quote request. An illustrative design, with no claimed client results.",
      services: ["Website concept", "Service layout", "Quote enquiry flow"],
      image: "images/demo-trades.webp",
      imageAlt: "Clearly labelled fictional trades website concept",
      url: "previews/index.html#trades",
      linkLabel: "Explore the concept",
      demonstration: true
    }
  ]
};
