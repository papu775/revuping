import AsyncStorage from '@react-native-async-storage/async-storage';
// A preference, never an authorization decision: callers validate current membership.
export const rememberedWorkspace = (userId: string) =>
  AsyncStorage.getItem(`rp-workspace:${userId}`);
export const rememberWorkspace = (userId: string, id: string) =>
  AsyncStorage.setItem(`rp-workspace:${userId}`, id);
