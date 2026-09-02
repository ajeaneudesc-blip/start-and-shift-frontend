import type { NativeStackScreenProps } from '@react-navigation/native-stack';

/** Écrans visibles tant que le compte n'est pas créé. */
export type AuthStackParamList = {
  Signup: undefined;
};

/** Écrans visibles une fois connecté. */
export type AppStackParamList = {
  Diagnostic: undefined;
  Strategy: undefined;
  Relation: undefined;
  Chat: { conversationId: number };
  Payment: undefined;
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
