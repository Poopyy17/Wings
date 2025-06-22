/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Type declarations for modules without types
declare module 'canvas-confetti';
declare module '@/hooks/use-mobile' {
  export function useIsMobile(): boolean;
}
