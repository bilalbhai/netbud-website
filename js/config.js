/*
 * NETBUD SETTINGS
 * Edit this file to update shared business details and optional integrations.
 * Never put passwords, secret API keys or private payment credentials here.
 */
window.NETBUD_CONFIG = {
  agencyName: "NetBud",
  tagline: "Your mate for everything digital.",
  supportingTagline: "Websites · Social Media · Advertising · Digital Support",
  contactEmail: "mdbilalzafar0@gmail.com",
  phoneNumber: "0425714451",
  phoneDisplay: "0425 714 451",
  whatsappNumber: "61425714451", // International digits only; no + or spaces.
  businessLocation: "Sydney, NSW, Australia",
  serviceAreas: ["Parramatta", "Fairfield", "Liverpool", "Blacktown", "Western Sydney", "Greater Sydney"],
  currency: "AUD", // INR is supported for a separately priced Indian storefront; this does not convert prices.
  locale: "en-AU",
  siteUrl: "", // Add the final HTTPS domain, including a repository path if applicable.
  publicPricing: true,
  starterWebsitePrice: 599,
  starterSocialPrice: 299,
  pricingNote: "Website starting amount includes GST where applicable. Final scope, applicable taxes and total for each service confirmed in your proposal.",
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
  formEndpoint: "", // Public HTTPS static-form endpoint, for example https://formspree.io/f/your-id.
  googleAnalyticsId: "", // Optional G-XXXXXXXXXX measurement ID. An opt-in is shown before loading analytics.
  hostedPaymentLinks: [], // Optional [{ label: "Pay an agreed invoice", url: "https://…" }]. Only add genuine links.
  upi: {
    enabled: false,
    id: "",
    qrImage: "", // Local image path for a real, verified recipient QR code.
    instructions: "Use the amount and reference in your agreed invoice. A manual payment is not automatically verified."
  },
  previewTurnaround: "A target of three business days after discovery, subject to eligibility and availability.",
  pricingPlans: [
    {
      title: "Project website",
      label: "A clear starting point",
      description: "A focused website project with an agreed scope and a straightforward handover.",
      priceSource: "starterWebsite", // Reuses starterWebsitePrice above; do not duplicate the amount.
      setup: null,
      monthly: null,
      startingAt: true,
      features: ["A website shaped around your business", "Mobile-friendly pages and enquiry pathways", "Basic search and sharing setup", "Scope and final total agreed before work starts"],
      note: "Hosting, domains and ongoing care are scoped separately.",
      featured: true
    },
    {
      title: "Flexible website plan",
      label: "Build an ongoing partnership",
      description: "Website setup and ongoing help, with the inclusions tailored to what you need.",
      setup: null,
      monthly: null,
      startingAt: false,
      features: ["A separately quoted setup fee", "An agreed monthly service scope", "Hosting and maintenance options", "Changes and support clearly defined"],
      note: "Month-to-month terms and cancellation details are confirmed in your written agreement.",
      featured: false
    },
    {
      title: "Managed website plan",
      label: "A longer-term home for your website",
      description: "A proposed 12-month managed arrangement for businesses wanting ongoing digital support.",
      setup: null,
      monthly: null,
      startingAt: false,
      features: ["A separately quoted setup fee", "A tailored monthly service fee", "An agreed care and support schedule", "A proposed 12-month service term"],
      note: "Term, ownership, inclusions and early cancellation arrangements require an agreed written proposal.",
      featured: false
    }
  ],
  marketingPlans: [
    {
      productId: 7,
      title: "Social Content Starter",
      label: "Show up consistently",
      description: "Ten short-form videos a month, thoughtful captions and publishing help for your social profiles.",
      billingType: "monthly",
      featured: true,
      features: ["10 short-form videos each month", "Reels / TikTok formats and captions", "Daily pool of 20 relevant hashtags", "Publishing to your agreed social profiles"],
      note: "Built from shop photos and website information. Hashtag use follows platform limits. In-store video filming and paid advertising are separate."
    },
    {
      productId: 8,
      title: "Paid Ads Management",
      label: "Give a campaign a clear plan",
      description: "Campaign setup, creative coordination and ongoing optimisation around an agreed goal.",
      billingType: "monthly",
      featured: false,
      features: ["An agreed campaign and audience plan", "Ad copy and creative coordination", "Campaign checks and adjustments", "Clear updates on spend and activity"],
      note: "Management pricing is quoted separately from the advertising budget paid to your selected platforms."
    },
    {
      productId: 9,
      title: "Social + Ads",
      label: "Keep content and campaigns together",
      description: "One coordinated content calendar and paid campaign plan for your business.",
      billingType: "monthly",
      featured: false,
      features: ["Social content and publishing support", "Paid campaign management", "A shared creative direction", "A tailored monthly review"],
      note: "Your proposal defines content volumes, campaign scope and the service fee. Advertising spend remains separate."
    }
  ],
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
      image: "images/portfolio-cafe.svg",
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
      image: "images/portfolio-tradie.svg",
      imageAlt: "Clearly labelled fictional trades website concept",
      url: "previews/index.html#trades",
      linkLabel: "Explore the concept",
      demonstration: true
    }
  ]
};
