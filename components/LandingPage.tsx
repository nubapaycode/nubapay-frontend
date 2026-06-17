'use client'

import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useRef, useState } from 'react'
import SiteNavbar from '@/components/SiteNavbar'

const TICKER = [
  'Sin cajas', 'Menú digital', 'QR antifraude', 'Pagos online',
  'IA integrada', 'Tiempo real', 'Eventos masivos',
]

const CSS = `
  @keyframes nb-fade-up {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes nb-marquee {
    from { transform: translateX(0); }
    to   { transform: translateX(-33.3333%); }
  }
  .nb-ticker-track {
    display: flex;
    width: max-content;
    animation: nb-marquee 24s linear infinite;
  }
  .nb-ticker:hover .nb-ticker-track { animation-play-state: paused; }
  @media (prefers-reduced-motion: reduce) {
    .nb-ticker-track { animation: none; transform: translateX(0); }
  }
  @keyframes nb-float-a {
    0%, 100% { transform: translateY(0px); }
    50%      { transform: translateY(-16px); }
  }
  @keyframes nb-float-b {
    0%, 100% { transform: translateY(0px) rotate(3deg); }
    50%      { transform: translateY(-12px) rotate(3deg); }
  }
  @keyframes nb-float-c {
    0%, 100% { transform: translateY(0px) rotate(-2deg); }
    50%      { transform: translateY(-10px) rotate(-2deg); }
  }
  @keyframes nb-ring {
    0%   { transform: scale(1);   opacity: 0.5; }
    100% { transform: scale(2.4); opacity: 0; }
  }
  @keyframes nb-dot {
    0%, 100% { opacity: 1;    }
    50%      { opacity: 0.25; }
  }
  @keyframes nb-chat {
    from { opacity: 0; transform: translateY(8px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0)   scale(1); }
  }
  @keyframes nb-msg-in {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes nb-typing {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
    30%           { transform: translateY(-4px); opacity: 1; }
  }
  /* El chat se dispara al entrar la card en viewport (.nb-in), no al cargar */
  .nb-msg { opacity: 0; }
  .nb-in .nb-msg { animation: nb-msg-in 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }
  .nb-in .nb-msg-0 { animation-delay: 0.3s; }
  .nb-in .nb-msg-1 { animation-delay: 1.1s; }
  .nb-in .nb-msg-2 { animation-delay: 2.0s; }
  .nb-in .nb-msg-3 { animation-delay: 2.9s; }
  .nb-in .nb-msg-4 { animation-delay: 3.7s; }
  .nb-typing-dot { display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: rgba(255,255,255,0.4); animation: nb-typing 1.1s ease-in-out infinite; }
  .nb-typing-dot:nth-child(2) { animation-delay: 0.18s; }
  .nb-typing-dot:nth-child(3) { animation-delay: 0.36s; }
  .nb-typing-bubble { opacity: 0; }
  .nb-in .nb-typing-bubble { animation: nb-msg-in 0.3s cubic-bezier(0.16,1,0.3,1) forwards; }
  .nb-in .nb-typing-1 { animation-delay: 0.7s;  }
  .nb-in .nb-typing-2 { animation-delay: 1.7s;  }
  .nb-in .nb-typing-3 { animation-delay: 2.6s;  }
  .nb-in .nb-typing-fade-1 { animation: nb-typing-out 0.2s ease forwards; animation-delay: 1.05s; }
  .nb-in .nb-typing-fade-2 { animation: nb-typing-out 0.2s ease forwards; animation-delay: 1.95s; }
  .nb-in .nb-typing-fade-3 { animation: nb-typing-out 0.2s ease forwards; animation-delay: 2.85s; }

  /* Atendium: hover de features, pulse del CTA del chat */
  .nb-atendium-feat { transition: transform 0.25s cubic-bezier(0.16,1,0.3,1); }
  .nb-atendium-feat:hover { transform: translateX(4px); }
  .nb-atendium-feat .nb-feat-ico { transition: background 0.25s, border-color 0.25s; }
  .nb-atendium-feat:hover .nb-feat-ico { background: rgba(255,92,26,0.16); border-color: rgba(255,92,26,0.35); }
  .nb-chat-cta { animation: nb-chatcta-pulse 2s ease-in-out infinite; }
  @keyframes nb-chatcta-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255,92,26,0.5); }
    50%      { box-shadow: 0 0 0 7px rgba(255,92,26,0); }
  }
  .nb-atendium-cta { transition: transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s cubic-bezier(0.16,1,0.3,1); }
  .nb-atendium-cta:hover { transform: scale(1.02); box-shadow: 0 10px 26px -10px rgba(255,92,26,0.5); }
  .nb-atendium-cta-arrow { transition: transform 0.35s cubic-bezier(0.16,1,0.3,1); }
  .nb-atendium-cta:hover .nb-atendium-cta-arrow { transform: translateX(4px); }
  @media (prefers-reduced-motion: reduce) {
    .nb-msg, .nb-in .nb-msg { opacity: 1; animation: none; }
    .nb-typing-bubble { display: none; }
    .nb-typing-dot, .nb-chat-cta { animation: none; }
    .nb-atendium-feat:hover, .nb-atendium-cta:hover { transform: none; }
  }

  /* Blockchain: timeline animado, hover features, CTA */
  .nb-cert-line { transform: scaleY(0); transform-origin: top; }
  .nb-in .nb-cert-line { animation: nb-grow 0.45s cubic-bezier(0.16,1,0.3,1) forwards; }
  @keyframes nb-grow { to { transform: scaleY(1); } }
  .nb-bc-feat { transition: background 0.25s, border-color 0.25s, transform 0.25s cubic-bezier(0.16,1,0.3,1); }
  .nb-bc-feat:hover { background: rgba(198,255,0,0.06) !important; border-color: rgba(198,255,0,0.25) !important; transform: translateX(4px); }
  .nb-bc-cta { transition: transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s cubic-bezier(0.16,1,0.3,1); }
  .nb-bc-cta:hover { transform: scale(1.02); box-shadow: 0 10px 26px -10px rgba(198,255,0,0.4); }
  .nb-bc-cta-arrow { transition: transform 0.35s cubic-bezier(0.16,1,0.3,1); }
  .nb-bc-cta:hover .nb-bc-cta-arrow { transform: translateX(4px); }
  @media (prefers-reduced-motion: reduce) {
    .nb-cert-line { transform: scaleY(1); animation: none; }
    .nb-bc-feat:hover, .nb-bc-cta:hover { transform: none; }
  }

  /* Eventos: hover de cards sin romper el reveal */
  .nb-evento-card {
    transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s cubic-bezier(0.16,1,0.3,1), border-color 0.3s;
  }
  @media (prefers-reduced-motion: reduce) {
    .nb-evento-card { transition: opacity 0.4s; }
  }

  /* CTA final: respiro del glow */
  .nb-cta-glow { animation: nb-cta-glow 6s ease-in-out infinite; }
  @keyframes nb-cta-glow { 0%, 100% { opacity: 0.65; transform: translateX(-50%) scale(1); } 50% { opacity: 1; transform: translateX(-50%) scale(1.08); } }
  @media (prefers-reduced-motion: reduce) { .nb-cta-glow { animation: none; } }

  /* Stats band: bordes y hover del número */
  .nb-stats-item { border-left: 1px solid rgba(0,0,0,0.12); }
  .nb-stats-item:first-child { border-left: none; }
  .nb-stat-num { transition: transform 0.3s cubic-bezier(0.16,1,0.3,1); transform-origin: left center; display: inline-block; }
  .nb-stats-item:hover .nb-stat-num { transform: scale(1.06); }
  @media (prefers-reduced-motion: reduce) {
    .nb-stats-item:hover .nb-stat-num { transform: none; }
  }
  @keyframes nb-typing-out {
    to { opacity: 0; visibility: hidden; }
  }

  .nb-hw { display: block; animation: nb-fade-up 1s cubic-bezier(0.16,1,0.3,1) both; }
  .nb-hw:nth-child(1) { animation-delay: 0.05s; }
  .nb-hw:nth-child(2) {
    animation-delay: 0.17s;
    display: inline-block;
    color: #0A0F00;
    padding: 2px 14px 6px;
    border-radius: 10px;
    margin-left: -4px;
    position: relative;
    background: transparent;
  }
  .nb-hw:nth-child(2)::before {
    content: '';
    position: absolute;
    inset: -2px -6px;
    /* doble pasada: dos trazos lime levemente desfasados */
    background-image:
      linear-gradient(101deg, rgba(198,255,0,0) 1%, rgba(198,255,0,0.95) 4%, rgba(198,255,0,0.95) 96%, rgba(198,255,0,0) 99%),
      linear-gradient(98deg, rgba(198,255,0,0) 2%, rgba(198,255,0,0.6) 6%, rgba(198,255,0,0.6) 94%, rgba(198,255,0,0) 98%);
    background-repeat: no-repeat, no-repeat;
    background-size: 100% 72%, 100% 88%;
    background-position: 0 90%, 0 55%;
    /* borde irregular real: máscara SVG con ruido (feTurbulence) */
    -webkit-mask-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='220'%20height='70'%3E%3Cfilter%20id='r2'%3E%3CfeTurbulence%20type='fractalNoise'%20baseFrequency='0.012%200.12'%20numOctaves='2'%20seed='11'%20result='n'/%3E%3CfeDisplacementMap%20in='SourceGraphic'%20in2='n'%20scale='12'/%3E%3C/filter%3E%3Crect%20x='8'%20y='10'%20width='204'%20height='50'%20rx='12'%20fill='black'%20filter='url(%23r2)'/%3E%3C/svg%3E");
    mask-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='220'%20height='70'%3E%3Cfilter%20id='r2'%3E%3CfeTurbulence%20type='fractalNoise'%20baseFrequency='0.012%200.12'%20numOctaves='2'%20seed='11'%20result='n'/%3E%3CfeDisplacementMap%20in='SourceGraphic'%20in2='n'%20scale='12'/%3E%3C/filter%3E%3Crect%20x='8'%20y='10'%20width='204'%20height='50'%20rx='12'%20fill='black'%20filter='url(%23r2)'/%3E%3C/svg%3E");
    -webkit-mask-size: 100% 100%;
    mask-size: 100% 100%;
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
    transform: scaleX(0);
    transform-origin: left;
    animation: nb-highlight 0.5s cubic-bezier(0.16,1,0.3,1) forwards;
    animation-delay: 0.85s;
    z-index: -1;
  }
  @keyframes nb-highlight {
    to { transform: scaleX(1); }
  }
  .nb-hw:nth-child(3) { animation-delay: 0.29s; }

  .nb-sub   { animation: nb-fade-up 1s cubic-bezier(0.16,1,0.3,1) 0.42s both; }
  .nb-cta   { animation: nb-fade-up 1s cubic-bezier(0.16,1,0.3,1) 0.60s both; }
  .nb-stats { animation: nb-fade-up 1s cubic-bezier(0.16,1,0.3,1) 0.78s both; }
  .nb-badge { animation: nb-fade-up 0.7s cubic-bezier(0.16,1,0.3,1) 0s both; }

  .nb-float-a { animation: nb-float-a 7s ease-in-out infinite; }
  .nb-float-b { animation: nb-float-b 9s ease-in-out 1.5s infinite; }
  .nb-float-c { animation: nb-float-c 6s ease-in-out 3s infinite; }

  .nb-ring-1 { animation: nb-ring 2.4s cubic-bezier(0.3,0.6,0.9,1) infinite; }
  .nb-ring-2 { animation: nb-ring 2.4s cubic-bezier(0.3,0.6,0.9,1) 1.2s infinite; }

  .nb-live { animation: nb-dot 2s ease-in-out infinite; }

  .nb-chat-msg { animation: nb-chat 0.5s cubic-bezier(0.16,1,0.3,1) both; }
  .nb-chat-msg:nth-child(1) { animation-delay: 0.7s; }
  .nb-chat-msg:nth-child(2) { animation-delay: 1.6s; }
  .nb-chat-msg:nth-child(3) { animation-delay: 2.6s; }
  .nb-chat-msg:nth-child(4) { animation-delay: 3.5s; }
  .nb-chat-msg:nth-child(5) { animation-delay: 4.5s; }

  .nb-btn-fill {
    position: relative;
    overflow: hidden;
    z-index: 0;
    transition: color 0.3s ease;
  }
  .nb-btn-fill::before {
    content: '';
    position: absolute;
    inset: 0;
    background: #0A0A0F;
    transform: translateX(-100%);
    transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: -1;
    border-radius: inherit;
  }
  .nb-btn-fill:hover::before { transform: translateX(0); }
  .nb-btn-fill:hover { color: #F5F5F0 !important; border-color: #0A0A0F !important; }

  .nb-hero-cta-primary {
    transition: transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s cubic-bezier(0.16,1,0.3,1), background 0.35s ease;
  }
  .nb-hero-cta-primary:hover {
    transform: scale(1.02);
    background: #D4FF3D !important;
    box-shadow: 0 8px 20px -10px rgba(198,255,0,0.3);
  }
  .nb-hero-cta-primary .nb-cta-arrow {
    transition: transform 0.35s cubic-bezier(0.16,1,0.3,1);
  }
  .nb-hero-cta-primary:hover .nb-cta-arrow { transform: translateX(6px); }

  /* ── Resaltado tipo marcador (doble pasada + borde irregular) ── */
  .nb-marker {
    position: relative;
    display: inline-block;
    color: #0A0F00;
    padding: 0 12px 1px;
    margin-top: 6px;
    font-weight: 400;
    text-transform: uppercase;
    transform: rotate(-1.2deg);
    z-index: 0;
  }
  .nb-marker-line {
    position: relative;
    display: inline-block;
    color: #0A0F00;
    padding: 2px 10px 6px;
    margin-top: 6px;
    transform: rotate(-0.8deg);
    z-index: 0;
  }
  .nb-marker::before,
  .nb-marker-line::before {
    content: '';
    position: absolute;
    inset: -2px -4px;
    z-index: -1;
    /* doble pasada: dos trazos lime levemente desfasados */
    background-image:
      linear-gradient(101deg, rgba(198,255,0,0) 1%, rgba(198,255,0,0.95) 4%, rgba(198,255,0,0.95) 96%, rgba(198,255,0,0) 99%),
      linear-gradient(98deg, rgba(198,255,0,0) 2%, rgba(198,255,0,0.6) 6%, rgba(198,255,0,0.6) 94%, rgba(198,255,0,0) 98%);
    background-repeat: no-repeat, no-repeat;
    background-size: 100% 70%, 100% 86%;
    background-position: 0 92%, 0 55%;
    /* borde irregular real: máscara SVG con ruido (feTurbulence) */
    -webkit-mask-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='120'%20height='44'%3E%3Cfilter%20id='r'%3E%3CfeTurbulence%20type='fractalNoise'%20baseFrequency='0.014%200.15'%20numOctaves='2'%20seed='7'%20result='n'/%3E%3CfeDisplacementMap%20in='SourceGraphic'%20in2='n'%20scale='8'/%3E%3C/filter%3E%3Crect%20x='6'%20y='7'%20width='108'%20height='30'%20rx='9'%20fill='black'%20filter='url(%23r)'/%3E%3C/svg%3E");
    mask-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='120'%20height='44'%3E%3Cfilter%20id='r'%3E%3CfeTurbulence%20type='fractalNoise'%20baseFrequency='0.014%200.15'%20numOctaves='2'%20seed='7'%20result='n'/%3E%3CfeDisplacementMap%20in='SourceGraphic'%20in2='n'%20scale='8'/%3E%3C/filter%3E%3Crect%20x='6'%20y='7'%20width='108'%20height='30'%20rx='9'%20fill='black'%20filter='url(%23r)'/%3E%3C/svg%3E");
    -webkit-mask-size: 100% 100%;
    mask-size: 100% 100%;
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
  }

  /* ── Scroll reveal ── */
  .nb-reveal {
    opacity: 0;
    transform: translateY(28px);
    transition: opacity 0.75s cubic-bezier(0.16,1,0.3,1), transform 0.75s cubic-bezier(0.16,1,0.3,1);
  }
  .nb-reveal.nb-in { opacity: 1; transform: translateY(0); }

  /* Step cards (Cómo funciona) — hover sin romper el reveal */
  .nb-step-card {
    transition: opacity 0.75s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s cubic-bezier(0.16,1,0.3,1);
  }
  @media (prefers-reduced-motion: reduce) {
    .nb-step-card { transition: opacity 0.4s; }
  }

  /* Bento layout (Cómo funciona) */
  .nb-steps-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1.15fr;
    grid-template-areas:
      "a b d"
      "c c d";
    gap: 12px;
  }

  /* Micro-interacciones on-reveal de los previews del bento */
  .nb-pop { opacity: 0; transform: translateY(10px); }
  .nb-in .nb-pop { animation: nb-pop 0.55s cubic-bezier(0.16,1,0.3,1) forwards; }
  @keyframes nb-pop { to { opacity: 1; transform: translateY(0); } }

  /* Scanline del QR (paso 01) */
  .nb-scanbox { position: relative; overflow: hidden; }
  .nb-scanline {
    position: absolute; left: 10px; right: 10px; top: 8%; height: 2px; border-radius: 2px;
    background: linear-gradient(90deg, transparent, #C6FF00, transparent);
    box-shadow: 0 0 10px 1px rgba(198,255,0,0.7);
    animation: nb-scan 2.6s ease-in-out infinite;
  }
  @keyframes nb-scan { 0% { top: 8%; } 50% { top: 88%; } 100% { top: 8%; } }

  /* Check de pago dibujándose (paso 03) */
  .nb-check-draw { stroke-dasharray: 16; stroke-dashoffset: 16; }
  .nb-in .nb-check-draw { animation: nb-draw 0.55s cubic-bezier(0.65,0,0.35,1) 0.55s forwards; }
  @keyframes nb-draw { to { stroke-dashoffset: 0; } }

  /* Badge "Listo" pulse (paso 04) */
  .nb-badge-pulse { animation: nb-badge-pulse 2.2s ease-in-out infinite; }
  @keyframes nb-badge-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(140,200,0,0.45); }
    50%      { box-shadow: 0 0 0 6px rgba(140,200,0,0); }
  }

  /* Dot de progreso secuencial en los números */
  .nb-prog-dot { display: inline-block; width: 5px; height: 5px; border-radius: 50%; margin-left: 3px; background: #D8D8DE; animation: nb-prog 4s linear infinite; }
  @keyframes nb-prog { 0% { background: #C6FF00; } 22% { background: #D8D8DE; } 100% { background: #D8D8DE; } }
  .nb-prog-dot-lime { animation-name: nb-prog-lime; }
  @keyframes nb-prog-lime { 0% { background: #0A0F00; } 22% { background: rgba(10,15,0,0.25); } 100% { background: rgba(10,15,0,0.25); } }

  /* Hover suave de los previews */
  .nb-prev { transition: transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s cubic-bezier(0.16,1,0.3,1); }
  .nb-prev:hover { transform: scale(1.025); }

  @media (prefers-reduced-motion: reduce) {
    .nb-pop, .nb-in .nb-pop { opacity: 1; transform: none; animation: none; }
    .nb-scanline { display: none; }
    .nb-badge-pulse, .nb-prog-dot { animation: none; }
    .nb-check-draw { stroke-dashoffset: 0; }
    .nb-prev:hover { transform: none; }
  }

  /* ── Live counter pulse ── */
  @keyframes nb-count-pop {
    0%   { transform: scale(1); }
    50%  { transform: scale(1.08); }
    100% { transform: scale(1); }
  }
  .nb-count-pop { animation: nb-count-pop 0.3s cubic-bezier(0.16,1,0.3,1); }

  /* ── Phone tap ripple ── */
  @keyframes nb-tap-ripple {
    0%   { transform: translate(-50%, -50%) scale(0.2); opacity: 0.55; }
    100% { transform: translate(-50%, -50%) scale(2.8); opacity: 0; }
  }
  .nb-tap-dot { animation: nb-tap-ripple 0.42s ease-out forwards; pointer-events: none; }

  /* ── Eventos section ── */
  .nb-eventos-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .nb-nav-inner { padding: 0 20px !important; }
    .nb-hero-section { padding-top: 100px !important; padding-left: 24px !important; padding-right: 24px !important; padding-bottom: 60px !important; }
    .nb-hero-grid { grid-template-columns: 1fr !important; }
    .nb-hero-cards { display: none !important; }
    .nb-steps-header { flex-direction: column !important; align-items: flex-start !important; gap: 24px !important; }
    .nb-steps-sub { text-align: left !important; max-width: 100% !important; }
    .nb-steps-grid { grid-template-columns: 1fr 1fr !important; grid-template-areas: "a b" "c c" "d d" !important; }
    .nb-step-arrow { display: none !important; }
    .nb-howit-section,
    .nb-atendium-section,
    .nb-blockchain-section,
    .nb-stats-section,
    .nb-eventos-section,
    .nb-cta-section { padding-left: 24px !important; padding-right: 24px !important; }
    .nb-eventos-grid { grid-template-columns: 1fr 1fr !important; }
    .nb-atendium-card { padding: 48px !important; grid-template-columns: 1fr !important; gap: 40px !important; }
    .nb-blockchain-grid { grid-template-columns: 1fr !important; }
    .nb-blockchain-left { border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.06) !important; padding: 60px 48px !important; }
    .nb-blockchain-right { padding: 60px 48px !important; }
    .nb-stats-grid { grid-template-columns: repeat(2, 1fr) !important; padding: 48px 40px !important; }
    .nb-stats-item { padding: 24px 20px !important; }
    .nb-stats-item:nth-child(odd) { border-left: none; }
    .nb-stats-item:nth-child(even) { border-left: 1px solid rgba(0,0,0,0.12); }
    .nb-faq-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
    .nb-faq-sticky { position: static !important; }
    .nb-cta-inner { padding: 80px 48px !important; }
    .nb-cta-buttons { flex-wrap: wrap !important; justify-content: center !important; }
    .nb-footer-top { grid-template-columns: 1fr 1fr !important; gap: 40px !important; }
    .nb-footer-links-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
  }

  @media (max-width: 640px) {
    .nb-nav-login { display: none !important; }
    .nb-hero-h1 { font-size: clamp(60px, 17vw, 116px) !important; }
    .nb-hero-section { padding-top: 90px !important; padding-left: 20px !important; padding-right: 20px !important; padding-bottom: 48px !important; }
    .nb-hero-stats { gap: 28px !important; }
    .nb-steps-grid { grid-template-columns: 1fr !important; grid-template-areas: "a" "b" "c" "d" !important; }
    .nb-howit-section,
    .nb-atendium-section,
    .nb-blockchain-section,
    .nb-stats-section,
    .nb-cta-section { padding-left: 20px !important; padding-right: 20px !important; }
    .nb-atendium-card { padding: 32px 24px !important; gap: 36px !important; }
    .nb-blockchain-left { padding: 48px 24px !important; }
    .nb-blockchain-right { padding: 48px 24px !important; }
    .nb-stats-grid { grid-template-columns: 1fr !important; padding: 36px 28px !important; }
    .nb-stats-item { border-left: none !important; padding-top: 20px !important; padding-bottom: 20px !important; border-top: 1px solid rgba(0,0,0,0.12) !important; }
    .nb-stats-item:first-child { border-top: none !important; }
    .nb-cta-inner { padding: 56px 24px !important; }
    .nb-cta-buttons { flex-direction: column !important; width: 100% !important; }
    .nb-cta-btn { width: 100% !important; justify-content: center !important; }
    .nb-hero-cta { flex-direction: column !important; width: 100% !important; }
    .nb-hero-cta-btn { width: 100% !important; justify-content: center !important; padding-left: 24px !important; padding-right: 24px !important; }
    .nb-faq-section,
    .nb-eventos-section { padding-left: 20px !important; padding-right: 20px !important; padding-bottom: 80px !important; }
    .nb-eventos-grid { grid-template-columns: 1fr !important; }
    .nb-faq-grid { gap: 32px !important; }
    .nb-faq-answer { padding-right: 0 !important; }
    .nb-footer { padding: 40px 20px 24px !important; }
    .nb-footer-top { grid-template-columns: 1fr !important; gap: 40px !important; }
    .nb-footer-links-grid { grid-template-columns: 1fr 1fr !important; gap: 24px !important; }
    .nb-footer-wordmark { font-size: clamp(56px, 18vw, 180px) !important; }
    .nb-footer-verify { display: none !important; }
  }
`

const S = {
  root: {
    fontFamily: 'var(--font-dm-sans, "DM Sans", sans-serif)',
    background: '#FFFFFF',
    color: '#0A0A0F',
    minHeight: '100vh',
    overflowX: 'hidden' as const,
  },
  accent: '#C6FF00',
  accentFg: '#0A0F00',
  accentText: '#3D6B00',
  orange: '#FF5C1A',
  muted: '#6A6A78',
  faint: '#9A9AA8',
  surface: '#FFFFFF',
  border: 'rgba(0,0,0,0.08)',
}

/* ── CountUp component ── */
function CountUp({ to, duration = 1800, prefix = '', suffix = '' }: {
  to: number; duration?: number; prefix?: string; suffix?: string
}) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const t0 = performance.now()
        const tick = (now: number) => {
          const p = Math.min((now - t0) / duration, 1)
          const eased = 1 - Math.pow(1 - p, 3)
          setVal(Math.round(eased * to))
          if (p < 1) requestAnimationFrame(tick)
          else setVal(to)
        }
        requestAnimationFrame(tick)
        obs.disconnect()
      }
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [to, duration])

  return <span ref={ref}>{prefix}{val}{suffix}</span>
}

export function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [chatConfirmed, setChatConfirmed] = useState(false)
  const [liveOrders, setLiveOrders] = useState(1247)
  const [phoneState, setPhoneState] = useState<'catalog' | 'tapping-cart' | 'cart' | 'tapping-pay' | 'qr'>('catalog')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  /* ── Scroll listener ── */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 28)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])


  /* ── Scroll reveal ── */
  useEffect(() => {
    const els = document.querySelectorAll('.nb-reveal')
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('nb-in') }),
      { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  /* ── Live orders counter ── */
  useEffect(() => {
    const id = setInterval(() => {
      setLiveOrders(n => n + Math.floor(Math.random() * 3 + 1))
    }, 2800)
    return () => clearInterval(id)
  }, [])

  /* ── Phone mockup interaction loop ── */
  useEffect(() => {
    let canceled = false
    const wait = (ms: number) => new Promise<void>(res => setTimeout(res, ms))
    const run = async () => {
      while (!canceled) {
        await wait(3200)
        if (canceled) break
        setPhoneState('tapping-cart')
        await wait(440)
        if (canceled) break
        setPhoneState('cart')
        await wait(2800)
        if (canceled) break
        setPhoneState('tapping-pay')
        await wait(440)
        if (canceled) break
        setPhoneState('qr')
        await wait(3000)
        if (canceled) break
        setPhoneState('catalog')
        await wait(500)
      }
    }
    run()
    return () => { canceled = true }
  }, [])

  return (
    <>
      <style>{CSS}</style>


      {/* Grain texture */}
      <svg aria-hidden="true" style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', opacity: 0.055, pointerEvents: 'none', zIndex: 9999 }}>
        <filter id="nb-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#nb-grain)" />
      </svg>

      <div style={S.root}>

        {/* ─── NAV ─── */}
        <SiteNavbar />

        {/* ─── HERO ─── */}
        <section className="nb-hero-section" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '60px 40px 80px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '65%', height: '70%', background: 'radial-gradient(ellipse, rgba(198,255,0,0.28) 0%, transparent 65%)' }} />
            <div style={{ position: 'absolute', bottom: '-5%', right: '-5%', width: '50%', height: '55%', background: 'radial-gradient(ellipse, rgba(255,92,26,0.1) 0%, transparent 65%)' }} />
          </div>

          <div className="nb-hero-grid" style={{ display: 'grid', gridTemplateColumns: '58% 42%', gap: '60px', alignItems: 'center', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
            <div>
              <h1 className="nb-hero-h1" style={{ fontSize: '104px', fontWeight: 900, lineHeight: '0.92', letterSpacing: '-0.05em', margin: '0 0 16px 0' }}>
                <span className="nb-hw">PEDÍ.</span>
                <span className="nb-hw">PAGÁ.</span>
                <span className="nb-hw">RETIRÁ.</span>
                <span className="sr-only"> Nubapay: menú digital, pagos móviles y retiro con QR para eventos y festivales.</span>
              </h1>

              <p className="nb-sub" style={{ fontSize: '18px', fontWeight: 400, color: 'rgba(0,0,0,0.5)', lineHeight: '1.65', maxWidth: '560px', margin: '0 0 48px 0' }}>
                <span style={{ fontWeight: 400, color: '#000000' }}>Menú digital</span>, pagos móviles y <span style={{ fontWeight: 400, color: '#000000' }}>retiro con QR</span> para eventos y festivales. Sin cajas. Sin caos.<br />
                <span className="nb-marker">Más ventas.</span>
              </p>

              <div className="nb-cta nb-hero-cta" style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                <Link href="/register" className="nb-hero-cta-btn nb-hero-cta-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '60px', boxSizing: 'border-box', background: '#C6FF00', color: '#0A0F00', padding: '0 20px 0 32px', borderRadius: '100px', textDecoration: 'none', fontSize: '18px', fontWeight: 400, letterSpacing: '-0.02em' }}>
                  Crear evento
                  <span className="nb-cta-arrow" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '100px', background: '#0A0F00', marginLeft: '6px' }}>
                    <ArrowRight color="#C6FF00" size={18} strokeWidth={1} />
                  </span>
                </Link>
                <a href="#como-funciona" className="nb-btn-fill nb-hero-cta-btn" style={{ display: 'inline-flex', alignItems: 'center', height: '60px', boxSizing: 'border-box', color: S.muted, padding: '0 32px', borderRadius: '100px', border: `1px solid rgba(0,0,0,0.14)`, textDecoration: 'none', fontSize: '17px', fontWeight: 400 }}>
                  Cómo funciona
                </a>
              </div>

              <div className="nb-stats nb-hero-stats" style={{ display: 'flex', gap: '48px', marginTop: '64px', paddingTop: '48px', borderTop: `1px solid rgba(0,0,0,0.14)`, flexWrap: 'wrap' }}>
                {[
                  { prefix: '+', to: 10, suffix: 'K', label: 'pedidos procesados' },
                  { prefix: '<', to: 2, suffix: ' min', label: 'espera en retiro' },
                  { prefix: '+', to: 98, suffix: '%', label: 'satisfacción de asistentes' },
                ].map(({ prefix, to, suffix, label }) => (
                  <div key={label}>
                    <div style={{ fontSize: '30px', fontWeight: 900, letterSpacing: '-0.045em', color: '#000000' }}>
                      <CountUp to={to} prefix={prefix} suffix={suffix} duration={1600} />
                    </div>
                    <div style={{ fontSize: '12px', color: '#000000', marginTop: '4px', fontWeight: 500 }}>{label}</div>
                  </div>
                ))}
              </div>

            </div>

            {/* Phone mockup */}
            <div className="nb-hero-cards" style={{ position: 'relative', height: '620px', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'translate(-180px, -100px)' }}>

              {/* Phone frame */}
              <div className="nb-float-a" style={{
                width: '258px', height: '524px',
                borderRadius: '46px',
                background: '#0A0A0F',
                padding: '3px',
                boxShadow: '0 48px 100px rgba(0,0,0,0.22), 0 12px 36px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
                position: 'relative', zIndex: 2,
                flexShrink: 0,
              }}>
                {/* Screen */}
                <div style={{ width: '100%', height: '100%', borderRadius: '44px', background: '#F7F7FA', overflow: 'hidden', position: 'relative' }}>

                  {/* Dynamic island */}
                  <div style={{ position: 'absolute', top: '13px', left: '50%', transform: 'translateX(-50%)', width: '78px', height: '22px', borderRadius: '100px', background: '#0A0A0F', zIndex: 10 }} />

                  {/* ── Catalog screen ── */}
                  <div style={{
                    position: 'absolute', inset: 0, background: '#F7F7FA',
                    transform: (phoneState === 'catalog' || phoneState === 'tapping-cart') ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.38s cubic-bezier(0.32,0,0,1)',
                  }}>
                    <div style={{ paddingTop: '50px', padding: '50px 14px 10px', background: '#FFFFFF', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: '#9A9AA8', marginBottom: '2px', letterSpacing: '0.02em' }}>Lollapalooza · Zona VIP</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#0A0A0F', letterSpacing: '-0.03em' }}>¿Qué querés pedir?</div>
                    </div>
                    <div style={{ display: 'flex', gap: '5px', padding: '8px 14px', background: '#FFFFFF', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      {[['Bebidas', true], ['Comidas', false], ['Snacks', false]].map(([cat, active]) => (
                        <span key={String(cat)} style={{ fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '100px', background: active ? '#C6FF00' : '#F0F0F0', color: active ? '#0A0F00' : '#6A6A78', whiteSpace: 'nowrap' }}>{String(cat)}</span>
                      ))}
                    </div>
                    {[
                      { name: 'Fernet con Coca', price: '$8.000', added: true, color: '#FDE8DC', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="5" y="2" width="6" height="12" rx="2" stroke="#C2410C" strokeWidth="1.2"/><path d="M5 6h6" stroke="#C2410C" strokeWidth="1.2"/><path d="M7 4h2" stroke="#C2410C" strokeWidth="1.2" strokeLinecap="round"/></svg> },
                      { name: 'Cerveza Heineken', price: '$6.000', added: false, color: '#DCFCE7', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M5 4h6l1 9H4L5 4z" stroke="#15803D" strokeWidth="1.2" strokeLinejoin="round"/><path d="M6 4V3a1 1 0 012 0v1" stroke="#15803D" strokeWidth="1.2"/><path d="M5 7h6" stroke="#15803D" strokeWidth="1.2" strokeDasharray="1.5 1.5"/></svg> },
                      { name: 'Agua mineral', price: '$2.500', added: false, color: '#DBEAFE', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2C8 2 4 7 4 10a4 4 0 008 0c0-3-4-8-4-8z" stroke="#1D4ED8" strokeWidth="1.2" strokeLinejoin="round"/></svg> },
                    ].map(({ name, price, added, color, icon }) => (
                      <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', borderBottom: '1px solid rgba(0,0,0,0.05)', background: '#FFFFFF' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: '#0A0A0F', lineHeight: '1.3' }}>{name}</div>
                            <div style={{ fontSize: '10px', color: '#9A9AA8', marginTop: '1px' }}>{price}</div>
                          </div>
                        </div>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: added ? '#C6FF00' : '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {added
                            ? <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 2.5 5.5-5.5" stroke="#0A0F00" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            : <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 2v6M2 5h6" stroke="#6A6A78" strokeWidth="1.4" strokeLinecap="round"/></svg>
                          }
                        </div>
                      </div>
                    ))}
                    {/* Cart bar */}
                    <div style={{ position: 'absolute', bottom: '16px', left: '12px', right: '12px', background: phoneState === 'tapping-cart' ? 'rgba(198,255,0,0.65)' : '#C6FF00', borderRadius: '100px', padding: '11px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.15s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#0A0F00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '9px', fontWeight: 800, color: '#C6FF00' }}>1</span>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#0A0F00' }}>Ver carrito</span>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#0A0F00' }}>$8.000</span>
                    </div>
                    {/* Tap ripple on cart bar */}
                    {phoneState === 'tapping-cart' && (
                      <div key={String(Date.now())} className="nb-tap-dot" style={{ position: 'absolute', bottom: '36px', left: '38%', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.18)' }} />
                    )}
                  </div>

                  {/* ── Cart screen ── */}
                  <div style={{
                    position: 'absolute', inset: 0, background: '#F7F7FA',
                    transform: (phoneState === 'cart' || phoneState === 'tapping-pay') ? 'translateX(0)' : (phoneState === 'qr' ? 'translateX(-100%)' : 'translateX(100%)'),
                    transition: 'transform 0.38s cubic-bezier(0.32,0,0,1)',
                  }}>
                    {/* Header */}
                    <div style={{ paddingTop: '50px', padding: '50px 14px 12px', background: '#FFFFFF', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#F4F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="8" height="10" viewBox="0 0 8 10" fill="none"><path d="M5.5 1.5L2 5l3.5 3.5" stroke="#0A0A0F" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#0A0A0F', letterSpacing: '-0.02em' }}>Tu carrito</span>
                      <span style={{ marginLeft: 'auto', fontSize: '9px', fontWeight: 700, background: '#C6FF00', color: '#0A0F00', borderRadius: '100px', padding: '2px 8px' }}>1 item</span>
                    </div>
                    {/* Cart item */}
                    <div style={{ margin: '10px 12px 0', background: '#FFFFFF', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)', padding: '11px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FDE8DC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="5" y="2" width="6" height="12" rx="2" stroke="#C2410C" strokeWidth="1.2"/><path d="M5 6h6" stroke="#C2410C" strokeWidth="1.2"/><path d="M7 4h2" stroke="#C2410C" strokeWidth="1.2" strokeLinecap="round"/></svg>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#0A0A0F' }}>Fernet con Coca</div>
                          <div style={{ fontSize: '10px', color: '#9A9AA8', marginTop: '1px' }}>$8.000</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1.5px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="8" height="2" viewBox="0 0 8 2" fill="none"><path d="M1 1h6" stroke="#0A0A0F" strokeWidth="1.5" strokeLinecap="round"/></svg>
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#0A0A0F', width: '10px', textAlign: 'center' }}>1</span>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#C6FF00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M4 1v6M1 4h6" stroke="#0A0F00" strokeWidth="1.5" strokeLinecap="round"/></svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Summary */}
                    <div style={{ margin: '8px 12px 0', background: '#FFFFFF', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 14px', borderBottom: '1px solid #F4F4F6' }}>
                        <span style={{ fontSize: '10px', color: '#9A9AA8' }}>Subtotal</span>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#0A0A0F' }}>$8.000</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 14px', borderBottom: '1px solid #F4F4F6' }}>
                        <span style={{ fontSize: '10px', color: '#9A9AA8' }}>Cargo por servicio</span>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#16A34A' }}>Gratis</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 14px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#0A0A0F' }}>Total</span>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#0A0A0F', letterSpacing: '-0.03em' }}>$8.000</span>
                      </div>
                    </div>
                    {/* Pay CTA */}
                    <div style={{ position: 'absolute', bottom: '16px', left: '12px', right: '12px', background: phoneState === 'tapping-pay' ? 'rgba(198,255,0,0.65)' : '#C6FF00', borderRadius: '100px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#0A0F00' }}>Ir a pagar · $8.000</span>
                    </div>
                    {/* Tap ripple on pay CTA */}
                    {phoneState === 'tapping-pay' && (
                      <div key={String(Date.now())} className="nb-tap-dot" style={{ position: 'absolute', bottom: '36px', left: '50%', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.18)' }} />
                    )}
                  </div>

                  {/* ── QR screen ── */}
                  <div style={{
                    position: 'absolute', inset: 0, background: '#F7F7FA',
                    transform: phoneState === 'qr' ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform 0.38s cubic-bezier(0.32,0,0,1)',
                    display: 'flex', flexDirection: 'column',
                  }}>
                    {/* Header */}
                    <div style={{ paddingTop: '50px', padding: '50px 14px 12px', background: '#FFFFFF', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#F4F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="8" height="10" viewBox="0 0 8 10" fill="none"><path d="M5.5 1.5L2 5l3.5 3.5" stroke="#0A0A0F" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#0A0A0F', letterSpacing: '-0.02em' }}>Tu pedido</span>
                    </div>

                    {/* QR area */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', gap: '14px' }}>
                      {/* QR card */}
                      <div style={{ background: '#FFFFFF', borderRadius: '22px', border: '1px solid rgba(0,0,0,0.07)', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', width: '100%' }}>
                        {/* Lime ring around QR */}
                        <div style={{ padding: '10px', background: 'rgba(198,255,0,0.12)', borderRadius: '16px', border: '1.5px solid rgba(198,255,0,0.5)' }}>
                          <QRPattern />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: '#0A0A0F', letterSpacing: '-0.02em' }}>Mostrá este QR</div>
                          <div style={{ fontSize: '10px', color: '#9A9AA8', marginTop: '2px' }}>en el punto de retiro</div>
                        </div>
                        <div style={{ width: '100%', height: '1px', background: '#F4F4F6' }} />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <span style={{ fontSize: '10px', color: '#9A9AA8', fontFamily: 'monospace' }}>#NB-0049</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#16A34A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            <span style={{ fontSize: '9px', fontWeight: 600, color: '#16A34A' }}>Verificado · Solana</span>
                          </div>
                        </div>
                      </div>

                      {/* Items summary */}
                      <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)', padding: '10px 14px', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#9A9AA8' }}>Fernet con Coca ×1</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#0A0A0F' }}>$8.000</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment confirmed badge — top right */}
              <div className="nb-float-b" style={{
                position: 'absolute', top: '52px', right: '-32px',
                background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)',
                borderRadius: '18px', padding: '11px 14px',
                boxShadow: '0 8px 28px rgba(0,0,0,0.09)',
                display: 'flex', alignItems: 'center', gap: '9px', zIndex: 3,
              }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5l3 3 7-7" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#0A0A0F', whiteSpace: 'nowrap' }}>Pago confirmado</div>
                  <div style={{ fontSize: '10px', color: '#9A9AA8' }}>$38.000 · MP</div>
                </div>
              </div>

              {/* QR card — bottom right */}
              <div className="nb-float-c" style={{
                position: 'absolute', bottom: '68px', right: '-40px', width: '158px',
                background: S.surface, border: `1px solid rgba(0,0,0,0.08)`,
                borderRadius: '24px', padding: '16px',
                boxShadow: '0 24px 48px rgba(0,0,0,0.12)', zIndex: 3,
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#0A0A0F', letterSpacing: '-0.01em' }}>Retiro QR</span>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: S.accentText, background: 'rgba(198,255,0,0.2)', border: '1px solid rgba(198,255,0,0.4)', padding: '2px 7px', borderRadius: '100px' }}>Listo</span>
                </div>
                {/* QR centered */}
                <div style={{ background: '#F7F7FA', borderRadius: '14px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                  <div style={{ width: '72px', height: '72px' }}><QRPattern size={72} /></div>
                </div>
                {/* Order info */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10px', color: S.faint, fontFamily: 'monospace' }}>#NB-0049</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22C55E' }} />
                    <span style={{ fontSize: '9px', color: '#16A34A', fontWeight: 600 }}>Verificado</span>
                  </div>
                </div>
              </div>

              {/* 0 min card — left */}
              <div style={{
                position: 'absolute', bottom: '140px', left: '80px',
                background: S.accent, borderRadius: '20px', padding: '16px 18px',
                boxShadow: '0 16px 40px rgba(198,255,0,0.4)', zIndex: 3,
                animation: 'nb-float-c 6s ease-in-out 3s infinite',
              }}>
                <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(10,15,0,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Espera</div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: S.accentFg, letterSpacing: '-0.055em', lineHeight: '1' }}>0 min</div>
                <div style={{ fontSize: '9px', color: 'rgba(10,15,0,0.42)', marginTop: '4px' }}>vs. 23 min avg</div>
              </div>

            </div>
          </div>
        </section>

        {/* ─── TICKER ─── */}
        <div className="nb-ticker" style={{ borderTop: `1px solid rgba(0,0,0,0.08)`, borderBottom: `1px solid rgba(0,0,0,0.08)`, padding: '18px 0', background: '#FFFFFF' }}>
          <span className="sr-only">{TICKER.join(' · ')}</span>
          <div aria-hidden="true" style={{ overflow: 'hidden', WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)', maskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)' }}>
            <div className="nb-ticker-track">
              {[...TICKER, ...TICKER, ...TICKER].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '0 20px', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#000000', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{item}</span>
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#8CC800' }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── HOW IT WORKS ─── */}
        <section id="como-funciona" className="nb-howit-section" style={{ padding: '120px 40px', maxWidth: '1280px', margin: '0 auto' }}>
          <div className="nb-reveal nb-steps-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '72px' }}>
            <h2 style={{ fontSize: 'clamp(44px, 5vw, 72px)', fontWeight: 500, letterSpacing: '-0.045em', lineHeight: '0.92', margin: 0, color: '#0A0A0F' }}>
              Del escaneo<br />al retiro.
            </h2>
            <p className="nb-steps-sub" style={{ maxWidth: '360px', color: '#000000', fontSize: '20px', lineHeight: '1.7', textAlign: 'right', marginBottom: '4px' }}>
              Escaneás, pedís, pagás y retirás. Sin cajas, sin caos, sin fricción. El flujo más rápido del mercado.
            </p>
          </div>

          <div className="nb-steps-grid">

            {/* 01 — Escaneá (chica, arriba izq) */}
            <div className="nb-reveal nb-step-card nb-bento-a" style={{ gridArea: 'a', background: '#FAFAFA', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '20px', padding: '26px 24px', display: 'flex', flexDirection: 'column' }}>
              <StepNum n="01" step={0} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', margin: '16px 0 8px 0', color: '#0A0A0F' }}>Escaneá el QR</h3>
              <p style={{ fontSize: '13px', lineHeight: '1.65', margin: 0, color: '#9A9AA8' }}>Entrás al menú digital del evento desde tu celular. Sin app, sin cuenta.</p>
              <div aria-hidden="true" style={{ flex: 1, paddingTop: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="nb-pop nb-scanbox nb-prev" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '12px', padding: '14px', animationDelay: '0.2s' }}>
                  <QRPattern size={88} />
                  <div className="nb-scanline" />
                </div>
              </div>
            </div>

            {/* 02 — Pedí (chica, arriba der) */}
            <div className="nb-reveal nb-step-card nb-bento-b" style={{ gridArea: 'b', background: '#FAFAFA', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '20px', padding: '26px 24px', display: 'flex', flexDirection: 'column', transitionDelay: '0.12s' }}>
              <StepNum n="02" step={1} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', margin: '16px 0 8px 0', color: '#0A0A0F' }}>Elegí y pedí</h3>
              <p style={{ fontSize: '13px', lineHeight: '1.65', margin: 0, color: '#9A9AA8' }}>Navegás el catálogo, agregás al carrito y confirmás en segundos.</p>
              <div aria-hidden="true" style={{ marginTop: 'auto', paddingTop: '22px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[['Birra artesanal', '$3.500'], ['Hamburguesa', '$8.000']].map(([name, price], idx) => (
                  <div key={name} className="nb-pop nb-prev" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '10px', padding: '9px 11px', animationDelay: `${0.2 + idx * 0.1}s` }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#0A0A0F' }}>{name}</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#0A0A0F' }}>{price}</span>
                  </div>
                ))}
                <div className="nb-pop" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#0A0A0F', borderRadius: '10px', padding: '9px', marginTop: '2px', animationDelay: '0.4s' }}>
                  <svg width="13" height="13" viewBox="0 0 22 22" fill="none"><path d="M3 3h2l2.5 10h9l2-7H7" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><circle cx="10" cy="19" r="1.4" fill="#FFFFFF"/><circle cx="17" cy="19" r="1.4" fill="#FFFFFF"/></svg>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#FFFFFF' }}>Agregar al carrito</span>
                  <span className="nb-pop" style={{ position: 'absolute', top: '-7px', right: '-7px', width: '19px', height: '19px', borderRadius: '50%', background: '#C6FF00', color: '#0A0F00', fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #FAFAFA', animationDelay: '0.6s' }}>2</span>
                </div>
              </div>
            </div>

            {/* 03 — Pagá (ancha, abajo) */}
            <div className="nb-reveal nb-step-card nb-bento-c" style={{ gridArea: 'c', background: '#FAFAFA', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '20px', padding: '28px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap', transitionDelay: '0.24s' }}>
              <div style={{ maxWidth: '300px' }}>
                <StepNum n="03" step={2} />
                <h3 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', margin: '14px 0 8px 0', color: '#0A0A0F' }}>Pagá online</h3>
                <p style={{ fontSize: '13px', lineHeight: '1.65', margin: 0, color: '#9A9AA8' }}>MercadoPago, transferencia o efectivo. 100% desde el celular, sin billetera.</p>
              </div>
              <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1', minWidth: '220px' }}>
                <div className="nb-pop nb-prev" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '12px', padding: '12px 14px', animationDelay: '0.25s' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path className="nb-check-draw" d="M1 5l3 3 7-7" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0A0A0F' }}>Pago confirmado</div>
                    <div style={{ fontSize: '10px', color: '#9A9AA8' }}>$38.000 · MercadoPago</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['MP', 'Visa', 'Efvo'].map((m, idx) => (
                    <span key={m} className="nb-pop" style={{ flex: 1, textAlign: 'center', fontSize: '10px', fontWeight: 700, color: '#0A0A0F', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '10px', padding: '7px 0', animationDelay: `${0.35 + idx * 0.07}s` }}>{m}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* 04 — Retirá (grande, lime, derecha) */}
            <div className="nb-reveal nb-step-card nb-step-card-hl nb-bento-d" style={{ gridArea: 'd', background: '#C6FF00', borderRadius: '20px', padding: '32px 30px', display: 'flex', flexDirection: 'column', transitionDelay: '0.36s' }}>
              <StepNum n="04" step={3} lime />
              <h3 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.025em', margin: '16px 0 8px 0', color: '#0A0F00' }}>Retirá sin fila</h3>
              <p style={{ fontSize: '14px', lineHeight: '1.6', margin: 0, color: 'rgba(10,15,0,0.62)' }}>Mostrás el QR en el punto de retiro y te entregan el pedido al instante.</p>
              <div aria-hidden="true" style={{ marginTop: 'auto', paddingTop: '28px' }}>
                <div className="nb-pop nb-prev" style={{ background: '#FFFFFF', borderRadius: '18px', padding: '22px', boxShadow: '0 12px 32px rgba(10,15,0,0.12)', animationDelay: '0.3s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#0A0A0F', letterSpacing: '-0.01em' }}>Retiro QR</span>
                    <span className="nb-badge-pulse" style={{ fontSize: '9px', fontWeight: 700, color: '#5A8A00', background: 'rgba(198,255,0,0.25)', border: '1px solid rgba(198,255,0,0.5)', padding: '3px 9px', borderRadius: '100px' }}>Listo</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                    <QRPattern value="https://nubapay.com/r/NB-0049" size={118} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: '#9A9AA8', fontFamily: 'monospace' }}>#NB-0049</span>
                    <span style={{ color: '#5A8A00', fontWeight: 700 }}><CountdownPill /></span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ─── ATENDIUM ─── */}
        <section id="atendium" className="nb-atendium-section" style={{ padding: '0 40px 120px', maxWidth: '1280px', margin: '0 auto' }}>
          <div className="nb-reveal nb-atendium-card" style={{
            background: '#FFFFFF', borderRadius: '36px', border: '1px solid rgba(0,0,0,0.08)',
            padding: '80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px',
            alignItems: 'center', overflow: 'hidden', position: 'relative',
          }}>
            <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: '55%', height: '130%', background: 'radial-gradient(ellipse, rgba(255,92,26,0.10) 0%, transparent 60%)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', marginBottom: '28px', background: 'rgba(255,92,26,0.08)', border: '1px solid rgba(255,92,26,0.2)', borderRadius: '100px', padding: '6px 13px 6px 11px' }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 0l1.4 3.6L11 5 7.4 6.4 6 10 4.6 6.4 1 5l3.6-1.4L6 0z" fill="#FF5C1A"/></svg>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#FF5C1A', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Atendium IA</span>
              </div>
              <h2 style={{ fontSize: 'clamp(38px, 3.8vw, 58px)', fontWeight: 500, letterSpacing: '-0.045em', lineHeight: '0.95', margin: '0 0 24px 0', color: '#0A0A0F' }}>
                Tu vendedor<br />más inteligente.
              </h2>
              <p style={{ fontSize: '16px', color: S.muted, lineHeight: '1.75', margin: '0 0 44px 0', maxWidth: '380px' }}>
                Atendium atiende, recomienda y vende por vos. Disponible 24/7 por web y WhatsApp, con upselling personalizado para cada asistente.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {([
                  { svg: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M9 1L2 9h6l-1 6 7-8H8l1-6z" stroke="#FF5C1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>, text: 'Responde consultas al instante' },
                  { svg: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="#FF5C1A" strokeWidth="1.5"/><circle cx="8" cy="8" r="6" stroke="#FF5C1A" strokeWidth="1.5" strokeDasharray="2 2"/><path d="M13.5 2.5l-3.2 3.2M2.5 13.5l3.2-3.2" stroke="#FF5C1A" strokeWidth="1.5" strokeLinecap="round"/></svg>, text: 'Sugiere combos con upselling inteligente' },
                  { svg: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2C5.2 2 3 4.2 3 7c0 1.8 1 3.4 2.4 4.3V13h5v-1.7C11.9 10.4 13 8.8 13 7c0-2.8-2.2-5-5-5z" stroke="#FF5C1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 13h4M8 2v1" stroke="#FF5C1A" strokeWidth="1.5" strokeLinecap="round"/></svg>, text: 'Entiende el menú y el contexto del evento' },
                  { svg: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 12l4-4 3 3 5-7" stroke="#FF5C1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M11 5h3v3" stroke="#FF5C1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>, text: 'Escala sin contratar más staff' },
                ] as { svg: React.ReactNode; text: string }[]).map(({ svg, text }) => (
                  <div key={text} className="nb-atendium-feat" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div className="nb-feat-ico" style={{ width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0, background: 'rgba(255,92,26,0.08)', border: '1px solid rgba(255,92,26,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{svg}</div>
                    <span style={{ fontSize: '14px', color: S.muted, fontWeight: 500 }}>{text}</span>
                  </div>
                ))}
              </div>
              <a href="/register" className="nb-atendium-cta" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '40px', background: '#FF5C1A', color: '#FFFFFF', padding: '0 8px 0 22px', height: '52px', boxSizing: 'border-box', borderRadius: '100px', textDecoration: 'none', fontSize: '15px', fontWeight: 500, letterSpacing: '-0.01em' }}>
                Probá Atendium
                <span className="nb-atendium-cta-arrow" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', borderRadius: '100px', background: 'rgba(255,255,255,0.18)' }}>
                  <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
              </a>
            </div>

            {/* Phone mockup */}
            <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '18px' }}>
              {/* Phone frame */}
              <div style={{
                width: '270px',
                borderRadius: '50px',
                background: '#0A0A0F',
                padding: '3px',
                boxShadow: '0 48px 100px rgba(0,0,0,0.28), 0 12px 36px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.07)',
                position: 'relative',
                flexShrink: 0,
              }}>
                {/* Side buttons */}
                <div style={{ position: 'absolute', left: '-3px', top: '88px', width: '3px', height: '32px', background: '#1A1A1F', borderRadius: '2px 0 0 2px' }} />
                <div style={{ position: 'absolute', left: '-3px', top: '132px', width: '3px', height: '56px', background: '#1A1A1F', borderRadius: '2px 0 0 2px' }} />
                <div style={{ position: 'absolute', left: '-3px', top: '198px', width: '3px', height: '56px', background: '#1A1A1F', borderRadius: '2px 0 0 2px' }} />
                <div style={{ position: 'absolute', right: '-3px', top: '148px', width: '3px', height: '72px', background: '#1A1A1F', borderRadius: '0 2px 2px 0' }} />

                {/* Screen */}
                <div style={{ borderRadius: '48px', background: '#F2F2F7', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '580px' }}>

                  {/* Status bar */}
                  <div style={{ background: '#FFFFFF', padding: '14px 22px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#0A0A0F' }}>9:41</span>
                    <div style={{ position: 'absolute', top: '14px', left: '50%', transform: 'translateX(-50%)', width: '90px', height: '22px', borderRadius: '100px', background: '#0A0A0F', zIndex: 10 }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><rect x="0" y="3" width="2.5" height="7" rx="0.5" fill="#0A0A0F"/><rect x="3.5" y="2" width="2.5" height="8" rx="0.5" fill="#0A0A0F"/><rect x="7" y="0.5" width="2.5" height="9.5" rx="0.5" fill="#0A0A0F"/><rect x="10.5" y="0" width="2.5" height="10" rx="0.5" fill="#0A0A0F" opacity="0.3"/></svg>
                      <svg width="14" height="11" viewBox="0 0 14 11" fill="none"><path d="M7 2.5C9.2 2.5 11.2 3.4 12.6 4.9L13.8 3.6C12.1 1.8 9.7 0.7 7 0.7C4.3 0.7 1.9 1.8 0.2 3.6L1.4 4.9C2.8 3.4 4.8 2.5 7 2.5Z" fill="#0A0A0F"/><path d="M7 5.5C8.4 5.5 9.7 6.1 10.6 7L11.8 5.7C10.6 4.5 8.9 3.7 7 3.7C5.1 3.7 3.4 4.5 2.2 5.7L3.4 7C4.3 6.1 5.6 5.5 7 5.5Z" fill="#0A0A0F"/><circle cx="7" cy="9.5" r="1.5" fill="#0A0A0F"/></svg>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
                        <div style={{ width: '20px', height: '10px', border: '1.5px solid #0A0A0F', borderRadius: '2.5px', padding: '1.5px', display: 'flex', alignItems: 'center' }}>
                          <div style={{ width: '65%', height: '100%', background: '#34C759', borderRadius: '1px' }} />
                        </div>
                        <div style={{ width: '2px', height: '5px', background: '#0A0A0F', borderRadius: '0 1px 1px 0', marginLeft: '1px' }} />
                      </div>
                    </div>
                  </div>

                  {/* Chat header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px 12px', background: '#FFFFFF', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF5C1A 0%, #FF8C4A 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                        <rect x="4" y="7" width="12" height="9" rx="3" stroke="white" strokeWidth="1.6"/>
                        <path d="M7 7V5.5a3 3 0 016 0V7" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
                        <circle cx="7.5" cy="11.5" r="1" fill="white"/>
                        <circle cx="12.5" cy="11.5" r="1" fill="white"/>
                        <path d="M8.5 13.5c.4.4 2.6.4 3 0" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0A0A0F', letterSpacing: '-0.01em' }}>Atendium</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
                        <span style={{ fontSize: '10px', color: '#8A8A94' }}>en línea</span>
                      </div>
                    </div>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="4" cy="9" r="1.5" fill="#8A8A94"/><circle cx="9" cy="9" r="1.5" fill="#8A8A94"/><circle cx="14" cy="9" r="1.5" fill="#8A8A94"/></svg>
                  </div>

                  {/* Messages */}
                  <div style={{ flex: 1, padding: '12px 12px 6px', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'hidden', justifyContent: 'flex-end', background: '#F2F2F7' }}>
                    <div className="nb-typing-bubble nb-typing-1 nb-typing-fade-1" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', gap: '6px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF5C1A, #FF8C4A)', flexShrink: 0 }} />
                      <div style={{ padding: '8px 12px', background: '#FFFFFF', borderRadius: '4px 14px 14px 14px', display: 'flex', gap: '4px', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
                        <span className="nb-typing-dot" style={{ background: 'rgba(0,0,0,0.25)' }} /><span className="nb-typing-dot" style={{ background: 'rgba(0,0,0,0.25)' }} /><span className="nb-typing-dot" style={{ background: 'rgba(0,0,0,0.25)' }} />
                      </div>
                    </div>
                    <div className="nb-msg nb-msg-0" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', gap: '6px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF5C1A, #FF8C4A)', flexShrink: 0 }} />
                      <div style={{ maxWidth: '78%', padding: '8px 12px', background: '#FFFFFF', borderRadius: '4px 14px 14px 14px', fontSize: '11.5px', lineHeight: '1.55', color: '#1C1C1E', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
                        Vi que pediste la Heineken 🍺 ¿Te suma un Fernet con Coca? Van perfectas juntas.
                      </div>
                    </div>
                    <div className="nb-msg nb-msg-1" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{ maxWidth: '78%', padding: '8px 12px', background: '#FF5C1A', borderRadius: '14px 4px 14px 14px', fontSize: '11.5px', lineHeight: '1.55', color: '#FFFFFF' }}>
                        Dale, agregá uno.
                      </div>
                    </div>
                    <div className="nb-typing-bubble nb-typing-2 nb-typing-fade-2" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', gap: '6px', maxHeight: '6px', overflow: 'hidden' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF5C1A, #FF8C4A)', flexShrink: 0 }} />
                      <div style={{ padding: '8px 12px', background: '#FFFFFF', borderRadius: '4px 14px 14px 14px', display: 'flex', gap: '4px', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
                        <span className="nb-typing-dot" style={{ background: 'rgba(0,0,0,0.25)' }} /><span className="nb-typing-dot" style={{ background: 'rgba(0,0,0,0.25)' }} /><span className="nb-typing-dot" style={{ background: 'rgba(0,0,0,0.25)' }} />
                      </div>
                    </div>
                    <div className="nb-msg nb-msg-2" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', gap: '6px', marginTop: '-6px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF5C1A, #FF8C4A)', flexShrink: 0 }} />
                      <div style={{ maxWidth: '78%', padding: '8px 12px', background: '#FFFFFF', borderRadius: '4px 14px 14px 14px', fontSize: '11.5px', lineHeight: '1.55', color: '#1C1C1E', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
                        ¡Listo! 🔥 También tengo el <strong>Combo Tragos</strong> (Heineken + Fernet) con 20% off.
                      </div>
                    </div>
                    <div className="nb-msg nb-msg-3" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{ maxWidth: '78%', padding: '8px 12px', background: '#FF5C1A', borderRadius: '14px 4px 14px 14px', fontSize: '11.5px', lineHeight: '1.55', color: '#FFFFFF' }}>
                        ¿Cuánto sale?
                      </div>
                    </div>
                    <div className="nb-typing-bubble nb-typing-3 nb-typing-fade-3" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', gap: '6px', maxHeight: '6px', overflow: 'hidden' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF5C1A, #FF8C4A)', flexShrink: 0 }} />
                      <div style={{ padding: '8px 12px', background: '#FFFFFF', borderRadius: '4px 14px 14px 14px', display: 'flex', gap: '4px', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
                        <span className="nb-typing-dot" style={{ background: 'rgba(0,0,0,0.25)' }} /><span className="nb-typing-dot" style={{ background: 'rgba(0,0,0,0.25)' }} /><span className="nb-typing-dot" style={{ background: 'rgba(0,0,0,0.25)' }} />
                      </div>
                    </div>
                    <div className="nb-msg nb-msg-4" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', gap: '6px', marginTop: '-6px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF5C1A, #FF8C4A)', flexShrink: 0 }} />
                      <div style={{ maxWidth: '78%', padding: '8px 12px', background: '#FFFFFF', borderRadius: '4px 14px 14px 14px', fontSize: '11.5px', lineHeight: '1.55', color: '#1C1C1E', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
                        $19.200 en vez de $24.000. ¿Lo sumamos? 👇
                      </div>
                    </div>

                    {chatConfirmed && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', animation: 'nb-msg-in 0.4s cubic-bezier(0.16,1,0.3,1) both' }}>
                          <div style={{ maxWidth: '78%', padding: '8px 12px', background: '#FF5C1A', borderRadius: '14px 4px 14px 14px', fontSize: '11.5px', lineHeight: '1.55', color: '#FFFFFF' }}>Sí, sumalo.</div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', gap: '6px', animation: 'nb-msg-in 0.4s cubic-bezier(0.16,1,0.3,1) 0.7s both' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF5C1A, #FF8C4A)', flexShrink: 0 }} />
                          <div style={{ maxWidth: '78%', padding: '8px 12px', background: '#FFFFFF', borderRadius: '4px 14px 14px 14px', fontSize: '11.5px', lineHeight: '1.55', color: '#1C1C1E', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
                            ✅ Combo agregado. Total: <strong>$43.200</strong>. ¿Confirmamos?
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Input bar */}
                  <div style={{ padding: '8px 12px 20px', background: '#FFFFFF', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    {chatConfirmed ? (
                      <div style={{ display: 'flex', gap: '6px', animation: 'nb-msg-in 0.4s cubic-bezier(0.16,1,0.3,1) 0.9s both' }}>
                        <div style={{ flex: 1, background: 'linear-gradient(135deg, #FF5C1A 0%, #FF7A3D 100%)', borderRadius: '20px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#FFFFFF' }}>Confirmar pedido</span>
                        </div>
                        <div onClick={() => setChatConfirmed(false)} style={{ background: '#F2F2F7', borderRadius: '20px', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="#6A6A78" strokeWidth="1.6" strokeLinecap="round"/></svg>
                        </div>
                      </div>
                    ) : (
                      <div onClick={() => setChatConfirmed(true)} className="nb-chat-cta" style={{ background: 'linear-gradient(135deg, #FF5C1A 0%, #FF7A3D 100%)', borderRadius: '20px', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#FFFFFF' }}>Sí, sumalo al pedido</span>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M7 3l4 4-4 4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    )}
                  </div>

                </div>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,92,26,0.9)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 0l1.4 3.6L11 5 7.4 6.4 6 10 4.6 6.4 1 5l3.6-1.4L6 0z" fill="#FF5C1A"/></svg>
                Demo interactiva — tocá el botón
              </span>
            </div>
          </div>
        </section>

        {/* ─── BLOCKCHAIN ─── */}
        <section id="qr-antifraude" className="nb-blockchain-section" style={{ padding: '0 40px 120px', maxWidth: '1280px', margin: '0 auto' }}>
          <div className="nb-reveal nb-blockchain-grid" style={{ background: '#0A0A0F', borderRadius: '36px', overflow: 'hidden', position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'stretch' }}>
            <div style={{ position: 'absolute', top: '-20%', left: '20%', width: '60%', height: '80%', background: 'radial-gradient(ellipse, rgba(198,255,0,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
            <div className="nb-blockchain-left" style={{ padding: '80px', position: 'relative', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 style={{ fontSize: 'clamp(38px, 3.2vw, 54px)', fontWeight: 500, letterSpacing: '-0.045em', lineHeight: '0.95', margin: '0 0 24px 0', color: '#FFFFFF' }}>
                Cada QR,<br />certificado en<br />
                <span className="nb-marker-line">blockchain.</span>
              </h2>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.75', margin: '0 0 48px 0' }}>
                Usamos unickeys sobre Solana Mainnet. Cada ticket se registra con SHA-256 y Merkle Trees: imposible de falsificar, verificable en segundos.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'SHA-256', sub: 'Hash criptográfico del ticket', icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="2" width="10" height="10" rx="2" stroke="#C6FF00" strokeWidth="1.4"/><path d="M4.5 7h5M7 4.5v5" stroke="#C6FF00" strokeWidth="1.4" strokeLinecap="round"/></svg> },
                  { label: 'Merkle Trees', sub: 'Hasta 10.000 tickets por tx', icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="3" r="1.5" stroke="#C6FF00" strokeWidth="1.4"/><circle cx="3" cy="11" r="1.5" stroke="#C6FF00" strokeWidth="1.4"/><circle cx="11" cy="11" r="1.5" stroke="#C6FF00" strokeWidth="1.4"/><path d="M7 4.5v2M7 6.5L3 9.5M7 6.5L11 9.5" stroke="#C6FF00" strokeWidth="1.2" strokeLinecap="round"/></svg> },
                  { label: 'Solana Mainnet', sub: 'Registro público e inmutable', icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5" stroke="#C6FF00" strokeWidth="1.4"/><path d="M4.5 7l1.5 1.5 3-3" stroke="#C6FF00" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> },
                ].map(({ label, sub, icon }) => (
                  <div key={label} className="nb-bc-feat" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(198,255,0,0.08)', border: '1px solid rgba(198,255,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginBottom: '2px' }}>{label}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
              <a href="https://explorer.solana.com" target="_blank" rel="noopener noreferrer" className="nb-bc-cta" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '40px', background: '#C6FF00', color: '#0A0F00', padding: '0 8px 0 22px', height: '50px', boxSizing: 'border-box', borderRadius: '100px', textDecoration: 'none', fontSize: '15px', fontWeight: 500, letterSpacing: '-0.01em' }}>
                Verificá un ticket
                <span className="nb-bc-cta-arrow" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', borderRadius: '100px', background: '#0A0F00' }}>
                  <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5" stroke="#C6FF00" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
              </a>
            </div>
            <div className="nb-blockchain-right" style={{ padding: '80px 64px', position: 'relative' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'rgba(198,255,0,0.08)', border: '1px solid rgba(198,255,0,0.2)', borderRadius: '100px', padding: '6px 13px 6px 11px', marginBottom: '36px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C6FF00', boxShadow: '0 0 6px #C6FF00' }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: S.accentText, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Proceso de certificación</span>
              </div>
              <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {[
                  { step: 'Pedido confirmado', detail: 'ORDER_ID: 9f2e1a…c4b' },
                  { step: 'Hash SHA-256', detail: '3d8f2c…b4e6f7' },
                  { step: 'Merkle Tree', detail: 'Root: a1b2c3d4…' },
                  { step: 'Registro en Solana', detail: 'TX: 4zMf8…Ve9p' },
                  { step: 'QR emitido', detail: 'Verificable públicamente' },
                ].map(({ step, detail }, i, arr) => (
                  <div key={step} className="nb-pop" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', animationDelay: `${0.15 + i * 0.28}s` }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: '2px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0, background: 'rgba(198,255,0,0.15)', border: '1.5px solid rgba(198,255,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 2.5 5.5-5.5" stroke="#C6FF00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      {i < arr.length - 1 && <div className="nb-cert-line" style={{ width: '1px', height: '36px', background: 'rgba(198,255,0,0.15)', marginTop: '4px', animationDelay: `${0.15 + i * 0.28 + 0.18}s` }} />}
                    </div>
                    <div style={{ paddingBottom: i < arr.length - 1 ? '12px' : '0', paddingTop: '2px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', marginBottom: '3px' }}>{step}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                        {detail.includes('…') ? <ScrambleText value={detail} delay={(0.15 + i * 0.28) * 1000 + 250} /> : detail}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <a href="https://explorer.solana.com" target="_blank" rel="noopener noreferrer" className="nb-bc-feat" style={{ marginTop: '40px', display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(198,255,0,0.08)', border: '1px solid rgba(198,255,0,0.2)', borderRadius: '100px', padding: '10px 18px', textDecoration: 'none' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1l1.5 2.5 3 .5-2 2 .5 3L7 8l-3 1 .5-3-2-2 3-.5z" stroke="#C6FF00" strokeWidth="1.3" strokeLinejoin="round"/></svg>
                <span style={{ fontSize: '12px', fontWeight: 700, color: S.accentText, letterSpacing: '0.04em' }}>Verificado en Solana Mainnet</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: '2px' }}><path d="M3 9l6-6M4 3h5v5" stroke="#C6FF00" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </a>
            </div>
          </div>
        </section>

        {/* ─── STATS BAND ─── */}
        <section className="nb-stats-section" style={{ padding: '0 40px 120px', maxWidth: '1280px', margin: '0 auto' }}>
          <div className="nb-reveal nb-stats-grid" style={{ background: '#C6FF00', borderRadius: '32px', padding: '64px 72px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', position: 'relative', overflow: 'hidden' }}>
            <div aria-hidden="true" style={{ position: 'absolute', top: '-30%', right: '-5%', width: '45%', height: '160%', background: 'radial-gradient(ellipse, rgba(10,15,0,0.07) 0%, transparent 60%)', pointerEvents: 'none' }} />
            <div aria-hidden="true" style={{ position: 'absolute', bottom: '-40%', left: '-5%', width: '40%', height: '160%', background: 'radial-gradient(ellipse, rgba(255,255,255,0.18) 0%, transparent 60%)', pointerEvents: 'none' }} />
            {[
              { icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 13l4-4 3 3 6-7" stroke="#0A0F00" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 5h3v3" stroke="#0A0F00" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>, prefix: '+', to: 40, suffix: '%', label: 'aumento en ventas promedio por evento', sub: 'vs. sin plataforma' },
              { icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="#0A0F00" strokeWidth="1.6"/><path d="M9 5v4l2.5 2" stroke="#0A0F00" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>, prefix: '<', to: 2, suffix: ' min', label: 'tiempo de espera en retiro', sub: 'vs. 23 min promedio' },
              { icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2l5.5 2.2v3.6c0 3.3-2.3 6-5.5 7.2-3.2-1.2-5.5-3.9-5.5-7.2V4.2L9 2z" stroke="#0A0F00" strokeWidth="1.5" strokeLinejoin="round"/><path d="M6.5 9l1.8 1.8 3.2-3.6" stroke="#0A0F00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>, prefix: '', to: 100, suffix: '%', label: 'transacciones verificadas en blockchain', sub: 'unickeys · Solana' },
              { icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M10 1.5L4 10h4l-1 6.5L14 8h-4l1-6.5z" stroke="#0A0F00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>, prefix: '+', to: 3, suffix: 'x', label: 'velocidad de atención por punto de retiro', sub: 'vs. caja tradicional' },
            ].map(({ icon, prefix, to, suffix, label, sub }) => (
              <div key={label} className="nb-stats-item" style={{ padding: '0 40px', position: 'relative' }}>
                <div aria-hidden="true" style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(10,15,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '22px' }}>{icon}</div>
                <div className="nb-stat-num" style={{ fontSize: 'clamp(40px, 3.5vw, 62px)', fontWeight: 900, color: '#0A0F00', letterSpacing: '-0.055em', lineHeight: '1', marginBottom: '12px' }}>
                  <CountUp to={to} prefix={prefix} suffix={suffix} duration={1800} />
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(10,15,0,0.7)', lineHeight: '1.5', fontWeight: 500, marginBottom: '6px' }}>{label}</div>
                <div style={{ fontSize: '11px', color: 'rgba(10,15,0,0.5)', fontWeight: 500, letterSpacing: '0.02em' }}>{sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── EVENTOS ─── */}
        <section className="nb-eventos-section" style={{ padding: '0 40px 120px', maxWidth: '1280px', margin: '0 auto' }}>

          <div className="nb-reveal nb-steps-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '72px' }}>
            <h2 style={{ fontSize: 'clamp(44px, 5vw, 72px)', fontWeight: 500, letterSpacing: '-0.045em', lineHeight: '0.92', margin: 0, color: '#0A0A0F' }}>
              Para cada<br />tipo de evento.
            </h2>
            <p className="nb-steps-sub" style={{ maxWidth: '380px', color: S.muted, fontSize: '16px', lineHeight: '1.75', textAlign: 'right', marginBottom: '4px' }}>
              Nubapay es la plataforma para eventos masivos de Argentina y Latinoamérica.
              Cualquier organizador activa el menú digital, los cobros online y los puntos
              de retiro con QR en menos de 20 minutos, sin hardware ni conocimientos técnicos.
            </p>
          </div>

          <div className="nb-eventos-grid">
            {([
              {
                icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="7" y="2" width="6" height="10" rx="3" stroke="#0A0A0F" strokeWidth="1.5"/><path d="M4 9a6 6 0 0012 0M10 15v3M7 18h6" stroke="#0A0A0F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
                title: 'Festivales y recitales',
                desc: 'Control total de barras de bebidas, comidas y merchandising durante el show. Escala a miles de pedidos simultáneos sin colapsar el punto de venta.',
              },
              {
                icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 3h14l-7 8zM10 11v6M7 18h6" stroke="#0A0A0F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
                title: 'Boliches y discotecas',
                desc: 'Venta de tragos, botella y barra sin interrumpir la fiesta. El asistente pide desde su lugar y retira en segundos con su QR único.',
              },
              {
                icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="6" width="6" height="11" rx="1" stroke="#0A0A0F" strokeWidth="1.5"/><rect x="11" y="3" width="6" height="14" rx="1" stroke="#0A0A0F" strokeWidth="1.5"/><path d="M5 9h2M5 12h2M13 6h2M13 9h2M13 12h2" stroke="#0A0A0F" strokeWidth="1.3" strokeLinecap="round"/></svg>,
                title: 'Fiestas privadas y corporativas',
                desc: 'Menú personalizado, control por sectores y visibilidad en tiempo real de cada venta y retiro durante el evento.',
              },
              {
                icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><ellipse cx="10" cy="10" rx="8" ry="5" stroke="#0A0A0F" strokeWidth="1.5"/><ellipse cx="10" cy="10" rx="3.5" ry="2" stroke="#0A0A0F" strokeWidth="1.5"/></svg>,
                title: 'Estadios y venues deportivos',
                desc: 'Miles de pedidos simultáneos con retiro instantáneo en múltiples barras, sin colas, sin efectivo y sin demoras entre pedido y entrega.',
              },
              {
                icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 8l1.8-4h10.4L17 8M4 8v9h12V8M3 8h14" stroke="#0A0A0F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
                title: 'Ferias y mercados gastronómicos',
                desc: 'Cada stand tiene su propio catálogo y punto de retiro. El organizador ve ventas y pedidos de todos los puestos en un solo panel.',
              },
              {
                icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M2 5h10v9H2zM12 8h3.5L18 11v3h-6" stroke="#0A0A0F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="6" cy="15" r="1.6" stroke="#0A0A0F" strokeWidth="1.5"/><circle cx="14.5" cy="15" r="1.6" stroke="#0A0A0F" strokeWidth="1.5"/></svg>,
                title: 'Food trucks y barras móviles',
                desc: 'Sin hardware adicional. El staff opera desde cualquier dispositivo y el asistente retira sin esperar turno ni hacer fila.',
              },
            ] as { icon: React.ReactNode; title: string; desc: string }[]).map(({ icon, title, desc }, i) => (
              <div key={title} className="nb-reveal nb-evento-card" style={{
                background: '#FAFAFA',
                border: i === 0 ? '1px solid rgba(198,255,0,0.6)' : '1px solid rgba(0,0,0,0.07)',
                borderRadius: '20px',
                padding: '28px 28px 32px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                transitionDelay: `${i * 0.08}s`,
              }}>
                <div className="nb-evento-ico" aria-hidden="true" style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(10,10,15,0.04)', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>{icon}</div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0A0A0F', letterSpacing: '-0.02em', lineHeight: '1.2', margin: 0 }}>{title}</h3>
                <p style={{ fontSize: '13px', color: S.muted, lineHeight: '1.7', margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>

          <div className="nb-reveal" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px', marginTop: '64px', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', color: S.muted, margin: 0, maxWidth: '420px' }}>¿No ves tu tipo de evento? Lo adaptamos a lo que necesites.</p>
            <a href="/register" className="nb-bc-cta" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#C6FF00', color: '#0A0F00', padding: '0 8px 0 22px', height: '52px', boxSizing: 'border-box', borderRadius: '100px', textDecoration: 'none', fontSize: '15px', fontWeight: 500, letterSpacing: '-0.01em' }}>
              Empezá gratis
              <span className="nb-bc-cta-arrow" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', borderRadius: '100px', background: '#0A0F00' }}>
                <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5" stroke="#C6FF00" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
            </a>
          </div>

        </section>

        {/* ─── FAQ ─── */}
        <section className="nb-faq-section" style={{ padding: '0 40px 120px', maxWidth: '1280px', margin: '0 auto' }}>
          <div className="nb-faq-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '80px', alignItems: 'start' }}>

            <div className="nb-reveal nb-faq-sticky" style={{ position: 'sticky', top: '96px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: S.faint, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>FAQ</p>
              <h2 style={{ fontSize: 'clamp(36px, 3.5vw, 52px)', fontWeight: 500, letterSpacing: '-0.045em', lineHeight: '0.95', margin: '0 0 20px 0', color: '#0A0A0F' }}>
                Preguntas<br />frecuentes.
              </h2>
              <p style={{ fontSize: '15px', color: S.muted, lineHeight: '1.7', margin: 0 }}>
                ¿Tenés dudas? Acá respondemos las más comunes. Si necesitás más info, escribinos.
              </p>
            </div>

            <div className="nb-reveal" style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { q: '¿Qué es Nubapay?', a: 'Nubapay es una plataforma para eventos que permite a los asistentes comprar desde el celular, pagar online y retirar su pedido con un QR, reduciendo filas y agilizando la atención en barras o puntos de entrega.' },
                { q: '¿Necesito descargar una app?', a: 'No. Nubapay funciona desde una web app responsive, por lo que los asistentes pueden acceder escaneando un QR o entrando desde un link, sin descargar nada.' },
                { q: '¿Qué tipo de eventos pueden usar Nubapay?', a: 'Puede usarse en boliches, festivales, fiestas, recitales, eventos privados, ferias, estadios o cualquier evento con venta de productos y puntos de retiro.' },
                { q: '¿El QR se puede usar más de una vez?', a: 'No. Cada QR es único y cuenta con validación antifraude para evitar que un mismo pedido sea retirado más de una vez.' },
                { q: '¿Puedo tener varios puntos de retiro?', a: 'Sí. Podés configurar diferentes barras o sectores —por ejemplo Barra Principal, Barra VIP, Patio o Sector Norte— y asignar productos específicos a cada punto.' },
                { q: '¿Cuánto cuesta usar Nubapay?', a: 'El modelo puede adaptarse al tipo de evento. Una opción es cobrar una comisión por transacción, por ejemplo sobre cada venta realizada dentro de la plataforma. Sin costos fijos.' },
                { q: '¿Cuánto tarda en configurarse Nubapay para un evento?', a: 'Muy poco. Podés tener el menú, los puntos de retiro y los pagos listos en menos de 20 minutos. No necesitás hardware especial ni conocimientos técnicos.' },
              ].map(({ q, a }, i) => {
                const isOpen = openFaq === i
                return (
                  <div
                    key={i}
                    style={{ borderTop: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        gap: '16px', padding: '22px 0', background: 'none', border: 'none',
                        cursor: 'pointer', textAlign: 'left',
                        fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
                      }}
                    >
                      <span style={{ fontSize: '16px', fontWeight: 600, color: '#0A0A0F', letterSpacing: '-0.02em', lineHeight: '1.3' }}>{q}</span>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                        background: isOpen ? '#C6FF00' : '#F4F4F6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.2s',
                      }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transition: 'transform 0.25s', transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}>
                          <path d="M6 2v8M2 6h8" stroke={isOpen ? '#0A0F00' : '#6A6A78'} strokeWidth="1.6" strokeLinecap="round"/>
                        </svg>
                      </div>
                    </button>
                    <div style={{
                      maxHeight: isOpen ? '300px' : '0px',
                      overflow: 'hidden',
                      transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1)',
                    }}>
                      <p className="nb-faq-answer" style={{ fontSize: '15px', color: S.muted, lineHeight: '1.75', margin: '0 0 22px 0', paddingRight: '44px' }}>{a}</p>
                    </div>
                  </div>
                )
              })}
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }} />
            </div>

          </div>
        </section>

        {/* ─── FINAL CTA ─── */}
        <section className="nb-cta-section" style={{ padding: '0 40px 160px', maxWidth: '1280px', margin: '0 auto' }}>
          <div className="nb-reveal nb-cta-inner" style={{ background: '#0A0A0F', borderRadius: '36px', padding: '100px 80px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div className="nb-cta-glow" style={{ position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)', width: '60%', height: '80%', background: 'radial-gradient(ellipse, rgba(198,255,0,0.08) 0%, transparent 65%)', pointerEvents: 'none' }} />
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'rgba(198,255,0,0.08)', border: '1px solid rgba(198,255,0,0.2)', borderRadius: '100px', padding: '6px 13px 6px 11px', marginBottom: '28px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C6FF00', boxShadow: '0 0 6px #C6FF00' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: S.accentText, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Para organizadores</span>
            </div>
            <h2 style={{ fontSize: 'clamp(54px, 6.5vw, 96px)', fontWeight: 500, letterSpacing: '-0.055em', lineHeight: '0.88', margin: '0 0 28px 0', color: '#FFFFFF', maxWidth: '700px' }}>
              Tu próximo<br />evento <span className="nb-marker-line">sin cajas.</span>
            </h2>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7', margin: '0 0 52px 0', maxWidth: '440px' }}>
              Registrate gratis, creá tu evento en minutos y empezá a vender. Sin costos fijos. Solo pagás cuando vendés.
            </p>
            <div className="nb-cta-buttons" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Link href="/register" className="nb-cta-btn nb-hero-cta-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '58px', boxSizing: 'border-box', background: '#C6FF00', color: '#0A0F00', padding: '0 8px 0 32px', borderRadius: '100px', textDecoration: 'none', fontSize: '16px', fontWeight: 400, letterSpacing: '-0.02em' }}>
                Crear mi evento gratis
                <span className="nb-cta-arrow" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '100px', background: '#0A0F00' }}>
                  <ArrowRight color="#C6FF00" size={18} strokeWidth={1} />
                </span>
              </Link>
              <Link href="/login" className="nb-cta-btn" style={{ display: 'inline-flex', alignItems: 'center', height: '58px', boxSizing: 'border-box', color: '#FFFFFF', padding: '0 30px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.1)', textDecoration: 'none', fontSize: '15px', fontWeight: 400 }}>
                Ya tengo cuenta
              </Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '28px', flexWrap: 'wrap', justifyContent: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
              {['Sin tarjeta', 'Setup en 20 min', 'Cancelás cuando quieras'].map((t, i) => (
                <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '14px' }}>
                  {i > 0 && <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)' }} />}
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="nb-footer" style={{ background: '#0A0A0F', padding: '72px 40px 0', overflow: 'hidden' }}>

          {/* Top grid */}
          <div className="nb-footer-top" style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '80px', paddingBottom: '64px' }}>

            {/* Left — brand + tagline + CTA */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '40px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.03em', color: '#FFFFFF' }}>nubapay</span>
                </div>
                <p style={{ fontSize: '15px', color: '#FFFFFF', lineHeight: '1.7', margin: '0 0 32px 0', maxWidth: '340px' }}>
                  Más ventas, menos filas. Para los que organizan eventos que la gente recuerda.
                </p>
                <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#C6FF00', color: '#0A0F00', padding: '12px 22px', borderRadius: '100px', textDecoration: 'none', fontSize: '14px', fontWeight: 700, letterSpacing: '-0.01em' }}>
                  Empezá ahora
                  <ArrowRight color="#0A0F00" />
                </Link>
              </div>
            </div>

            {/* Right — link columns */}
            <div className="nb-footer-links-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' }}>
              {[
                {
                  title: 'Producto',
                  links: [
                    { label: 'Cómo funciona', href: '#como-funciona' },
                    { label: 'Atendium IA', href: '#' },
                    { label: 'Blockchain QR', href: '#' },
                    { label: 'Para organizadores', href: '/register' },
                  ],
                },
                {
                  title: 'Empresa',
                  links: [
                    { label: 'Sobre Nubapay', href: '/nosotros' },
                    { label: 'Contacto', href: '/nosotros#equipo' },
                  ],
                },
                {
                  title: 'Legal',
                  links: [
                    { label: 'Términos de uso', href: '/terminos' },
                    { label: 'Privacidad', href: '/privacidad' },
                    { label: 'Seguridad', href: '/seguridad' },
                  ],
                },
              ].map(({ title, links }) => (
                <div key={title}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 20px 0' }}>{title}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {links.map(({ label, href }) => (
                      <a key={label} href={href} style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', textDecoration: 'none', transition: 'color 0.15s', fontWeight: 400 }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
                      >{label}</a>
                    ))}
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Wordmark */}
          <div style={{ maxWidth: '1280px', margin: '0 auto', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0px', marginBottom: '40px' }}>
              <div
                className="nb-footer-wordmark"
                style={{
                  fontSize: 'clamp(80px, 13.5vw, 196px)',
                  fontWeight: 900,
                  letterSpacing: '-0.055em',
                  lineHeight: '0.85',
                  color: 'transparent',
                  WebkitTextStroke: '1px rgba(255,255,255,0.1)',
                  userSelect: 'none',
                }}
              >
                nubapay
              </div>
              <svg
                className="nb-footer-verify"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="0.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ width: '8em', height: '8em', flexShrink: 0, marginTop: '40px', marginRight: '300px' }}
              >
                <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ padding: '20px 0' }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', fontWeight: 400 }}>© 2026 Nubapay · Argentina</span>
            </div>
          </div>

        </footer>

      </div>
    </>
  )
}

function ArrowRight({ color = '#0A0A0F', size = 14, strokeWidth = 1.5 }: { color?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckMark() {
  return (
    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
      <path d="M1 3l2 2 4-4" stroke="#3D6B00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StepNum({ n, step, lime = false }: { n: string; step: number; lime?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
      <span style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1, color: lime ? '#0A0F00' : '#0A0A0F' }}>{n}</span>
      <span className={`nb-prog-dot${lime ? ' nb-prog-dot-lime' : ''}`} style={{ alignSelf: 'center', animationDelay: `${step}s` }} />
    </div>
  )
}

function ScrambleText({ value, delay = 0 }: { value: string; delay?: number }) {
  const [display, setDisplay] = useState(value)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const pool = '0123456789abcdefABCDEF'
    let interval: ReturnType<typeof setInterval> | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || started.current) return
      started.current = true
      obs.disconnect()
      timer = setTimeout(() => {
        let frame = 0
        const total = 16
        interval = setInterval(() => {
          frame += 1
          const revealed = Math.floor((frame / total) * value.length)
          setDisplay(value.split('').map((ch, i) => (i < revealed || ch === '…' || ch === ' ' || ch === ':') ? ch : pool[Math.floor(Math.random() * pool.length)]).join(''))
          if (frame >= total && interval) { clearInterval(interval); setDisplay(value) }
        }, 45)
      }, delay)
    }, { threshold: 0.4 })
    obs.observe(el)
    return () => { obs.disconnect(); if (interval) clearInterval(interval); if (timer) clearTimeout(timer) }
  }, [value, delay])
  return <span ref={ref}>{display}</span>
}

function CountdownPill() {
  const [s, setS] = useState(45)
  useEffect(() => {
    const id = setInterval(() => setS(v => (v <= 1 ? 45 : v - 1)), 1000)
    return () => clearInterval(id)
  }, [])
  const mm = Math.floor(s / 60)
  const ss = String(s % 60).padStart(2, '0')
  return <>Listo en {mm}:{ss}</>
}

function QRPattern({ value = 'https://nubapay.com', size = 76 }: { value?: string; size?: number }) {
  return (
    <QRCodeSVG
      value={value}
      size={size}
      level="M"
      bgColor="#FFFFFF"
      fgColor="#0A0A0F"
      marginSize={0}
      style={{ display: 'block' }}
    />
  )
}
