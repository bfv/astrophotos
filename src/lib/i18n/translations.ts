export type Locale = 'en' | 'nl';

export type TranslationSet = {
  user: {
    displayNameFallback: string;
    menuAriaLabel: string;
    loginAriaLabel: string;
    logout: string;
  };
  settings: {
    menuItem: string;
    title: string;
    language: string;
    languageAuto: string;
    location: string;
    locationLat: string;
    locationLon: string;
    useMyLocation: string;
    locationAcquired: string;
    locationError: string;
    timezone: string;
    timezoneAuto: string;
    timezoneDetect: string;
    api: string;
    save: string;
    cancel: string;
    discardTitle: string;
    discardMessage: string;
    discardConfirm: string;
    discardCancel: string;
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
  chart: {
    today: string;
    todayTooltip: string;
    ra0hTooltip: string;
    ra12hTooltip: string;
    photoMode: string;
    planningMode: string;
  };
  planning: {
    noLocation: string;
  };
};

export const translations: Record<Locale, TranslationSet> = {
  en: {
    user: {
      displayNameFallback: 'User',
      menuAriaLabel: 'User menu',
      loginAriaLabel: 'Log in',
      logout: 'Log out',
    },
    settings: {
      menuItem: 'Settings',
      title: 'Settings',
      language: 'Language',
      languageAuto: 'Auto (from browser)',
      location: 'Observation location',
      locationLat: 'Latitude',
      locationLon: 'Longitude',
      useMyLocation: 'Use my location',
      locationAcquired: 'Location acquired',
      locationError: 'Could not get location',
      timezone: 'Time zone',
      timezoneAuto: 'Auto (from location / device)',
      timezoneDetect: 'Use system time zone',
      api: 'API',
      save: 'Save',
      cancel: 'Cancel',
      discardTitle: 'Discard changes?',
      discardMessage: 'You have unsaved changes. Discard them and close?',
      discardConfirm: 'Discard',
      discardCancel: 'Keep editing',
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
    chart: {
      today: 'Today',
      todayTooltip: "Centers on tonight's sky: the RA highest at midnight (or 1 AM in summer), adjusted for your timezone and location.",
      ra0hTooltip: 'Center on RA 0h',
      ra12hTooltip: 'Center on RA 12h',
      photoMode: 'Photo',
      planningMode: 'Planning',
    },
    planning: {
      noLocation: 'Set your observation location in Settings to see altitude data.',
    },
  },
  nl: {
    user: {
      displayNameFallback: 'Gebruiker',
      menuAriaLabel: 'Gebruikersmenu',
      loginAriaLabel: 'Inloggen',
      logout: 'Uitloggen',
    },
    settings: {
      menuItem: 'Instellingen',
      title: 'Instellingen',
      language: 'Taal',
      languageAuto: 'Automatisch (via browser)',
      location: 'Waarnemingslocatie',
      locationLat: 'Breedtegraad',
      locationLon: 'Lengtegraad',
      useMyLocation: 'Gebruik mijn locatie',
      locationAcquired: 'Locatie verkregen',
      locationError: 'Locatie niet beschikbaar',
      timezone: 'Tijdzone',
      timezoneAuto: 'Automatisch (van locatie / apparaat)',
      timezoneDetect: 'Gebruik systeemtijdzone',
      api: 'API',
      save: 'Opslaan',
      cancel: 'Annuleren',
      discardTitle: 'Wijzigingen verwerpen?',
      discardMessage: 'Je hebt niet-opgeslagen wijzigingen. Verwerpen en sluiten?',
      discardConfirm: 'Verwerpen',
      discardCancel: 'Bewerken',
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
    chart: {
      today: 'Vandaag',
      todayTooltip: 'Centreert op de hemel van vanavond: de RA die het hoogst staat om middernacht (of 01:00 in de zomer), aangepast voor je tijdzone en locatie.',
      ra0hTooltip: 'Centreer op RA 0h',
      ra12hTooltip: 'Centreer op RA 12h',
      photoMode: "Foto's",
      planningMode: 'Planning',
    },
    planning: {
      noLocation: 'Stel je waarnemingslocatie in via Instellingen om hoogtedata te zien.',
    },
  },
};
