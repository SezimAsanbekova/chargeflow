// Типы для автодополнения переводов

export interface LandingTranslations {
  nav: {
    logo: string;
    features: string;
    howItWorks: string;
    pricing: string;
    app: string;
    login: string;
  };
  hero: {
    badge: string;
    title: string;
    titleHighlight: string;
    description: string;
    downloadApp: string;
    findStation: string;
    stats: {
      stations: {
        value: string;
        label: string;
      };
      connectors: {
        value: string;
        label: string;
      };
      support: {
        value: string;
        label: string;
      };
    };
  };
  features: {
    badge: string;
    title: string;
    titleHighlight: string;
    smartSearch: {
      title: string;
      description: string;
      connectors: string[];
    };
    booking: {
      title: string;
      description: string;
      benefits: string[];
    };
    quickStart: {
      title: string;
      description: string;
      tracking: string[];
    };
  };
  howItWorks: {
    badge: string;
    title: string;
    titleHighlight: string;
    steps: Array<{
      title: string;
      description: string;
    }>;
  };
  payment: {
    badge: string;
    title: string;
    titleHighlight: string;
    methods: {
      card: {
        title: string;
        description: string;
      };
      balance: {
        title: string;
        description: string;
      };
      receipts: {
        title: string;
        description: string;
      };
    };
    invoice: {
      energy: string;
      tariff: string;
      deposit: string;
      total: string;
      pay: string;
      energyValue: string;
      tariffValue: string;
      depositValue: string;
      totalValue: string;
    };
  };
  app: {
    badge: string;
    title: string;
    titleHighlight: string;
    description: string;
    stats: {
      downloads: {
        value: string;
        label: string;
      };
      rating: {
        value: string;
        label: string;
      };
      support: {
        value: string;
        label: string;
      };
      uptime: {
        value: string;
        label: string;
      };
    };
    card: {
      title: string;
      compatibility: string;
      features: string[];
      appStore: {
        prefix: string;
        name: string;
      };
      googlePlay: {
        prefix: string;
        name: string;
      };
    };
  };
  pricing: {
    badge: string;
    title: string;
    titleHighlight: string;
    description: string;
    plans: {
      ac: {
        title: string;
        subtitle: string;
        price: string;
        currency: string;
        unit: string;
        features: string[];
      };
      dcFast: {
        badge: string;
        title: string;
        subtitle: string;
        price: string;
        currency: string;
        unit: string;
        features: string[];
      };
      dcUltra: {
        title: string;
        subtitle: string;
        price: string;
        currency: string;
        unit: string;
        features: string[];
      };
    };
    note: string;
  };
  cta: {
    title: string;
    description: string;
    downloadApp: string;
    contact: string;
  };
  footer: {
    description: string;
    company: {
      title: string;
      links: string[];
    };
    support: {
      title: string;
      links: string[];
    };
    legal: {
      title: string;
      links: string[];
    };
    copyright: string;
    country: string;
    language: string;
  };
}

export type TranslationPage = 'landing';
