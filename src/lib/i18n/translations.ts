export type Locale = 'en' | 'nl';

export type TranslationSet = {
  user: {
    displayNameFallback: string;
    menuAriaLabel: string;
    loginAriaLabel: string;
    accountSettings: string;
    logout: string;
  };
  bar: {
    photosLoaded: (count: number) => string;
  };
  info: {
    close: string;
    date: string;
    equipment: string;
    exposure: string;
  };
  page: {
    loggedOut: string;
  };
  callback: {
    loggingIn: string;
    loginFailed: (error: string) => string;
    backToHome: string;
  };
};

export const translations: Record<Locale, TranslationSet> = {
  en: {
    user: {
      displayNameFallback: 'User',
      menuAriaLabel: 'User menu',
      loginAriaLabel: 'Log in',
      accountSettings: 'Account settings',
      logout: 'Log out',
    },
    bar: {
      photosLoaded: (count) => `${count} photo${count !== 1 ? 's' : ''} loaded`,
    },
    info: {
      close: 'Close',
      date: 'Date',
      equipment: 'Equipment',
      exposure: 'Exposure',
    },
    page: {
      loggedOut: 'You have been logged out.',
    },
    callback: {
      loggingIn: 'Logging in\u2026',
      loginFailed: (error) => `Login failed: ${error}`,
      backToHome: 'Back to home',
    },
  },
  nl: {
    user: {
      displayNameFallback: 'Gebruiker',
      menuAriaLabel: 'Gebruikersmenu',
      loginAriaLabel: 'Inloggen',
      accountSettings: 'Accountinstellingen',
      logout: 'Uitloggen',
    },
    bar: {
      photosLoaded: (count) => `${count} foto${count !== 1 ? "'s" : ''} geladen`,
    },
    info: {
      close: 'Sluiten',
      date: 'Datum',
      equipment: 'Apparatuur',
      exposure: 'Belichting',
    },
    page: {
      loggedOut: 'Je bent uitgelogd.',
    },
    callback: {
      loggingIn: 'Inloggen\u2026',
      loginFailed: (error) => `Inloggen mislukt: ${error}`,
      backToHome: 'Terug naar home',
    },
  },
};
