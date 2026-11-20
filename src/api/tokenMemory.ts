let memoryAccessToken: string | null = null;
let memoryMfaToken: string | null = null;

export const tokenMemory = {
  getAccessToken: () => memoryAccessToken,
  setAccessToken: (token: string | null) => {
    memoryAccessToken = token;
  },
  getMfaToken: () => memoryMfaToken,
  setMfaToken: (token: string | null) => {
    memoryMfaToken = token;
  },
  clear: () => {
    memoryAccessToken = null;
    memoryMfaToken = null;
  },
};