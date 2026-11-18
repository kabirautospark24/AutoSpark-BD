import { memo } from 'react';

/**
 * Site-wide atmospheric layer.
 *
 * Sits above section backgrounds but below site chrome. Every visual is a
 * non-interactive, GPU-friendly gradient so the existing page components keep
 * their layout, content and behaviour untouched.
 */
export const AmbientBackdrop = memo(() => (
  <div className="ambient-backdrop" aria-hidden="true">
    <div className="ambient-backdrop__wash" />
    <div className="ambient-backdrop__beam ambient-backdrop__beam--one" />
    <div className="ambient-backdrop__beam ambient-backdrop__beam--two" />
    <div className="ambient-backdrop__vignette" />
    <div className="ambient-backdrop__grain" />
  </div>
));

AmbientBackdrop.displayName = 'AmbientBackdrop';
