import type { NativeStackScreenProps } from '@react-navigation/native-stack';

/** Écrans visibles tant que le compte n'est pas créé ET le consentement donné. */
export type AuthStackParamList = {
  Signup: undefined;
  Consent: undefined;
};

/** Écrans visibles une fois connecté. Complété aux étapes 7 à 11. */
export type AppStackParamList = {
  Diagnostic: undefined;
  Strategy: undefined;
  Relation: undefined;
  /** `draft` pré-remplit le composeur sans envoyer — utilisé par la bibliothèque. */
  Chat: { conversationId: number; draft?: string };
  Payment: undefined;
  Offers: undefined;
  Library: undefined;
  Tracking: undefined;
};

export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;

export type AppScreenProps<T extends keyof AppStackParamList> = NativeStackScreenProps<
  AppStackParamList,
  T
>;
