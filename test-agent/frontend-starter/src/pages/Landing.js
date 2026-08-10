// src/pages/Landing.js
// The cinematic marketing page (frontend-starter/public/landing.html) is a self-contained
// vanilla HTML/CSS/JS document (canvas particles, scroll parallax) — embedding it via iframe
// keeps it fully isolated from React's render/lifecycle instead of porting its scroll and
// canvas logic into React effects, which would be a much larger, riskier rewrite for no
// functional benefit.
import React from 'react';

const Landing = () => (
  <iframe
    src="/landing.html"
    title="SupportIQ"
    style={{
      position: 'fixed',
      inset: 0,
      width: '100vw',
      height: '100vh',
      border: 'none',
      display: 'block',
    }}
  />
);

export default Landing;
