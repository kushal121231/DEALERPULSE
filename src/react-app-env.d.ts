/// <reference types="react-scripts" />

// Fix recharts JSX compatibility with React 18 types
declare namespace React {
  interface DOMAttributes<T> {
    onResize?: ReactEventHandler<T> | undefined;
    onResizeCapture?: ReactEventHandler<T> | undefined;
    nonce?: string | undefined;
  }
}
