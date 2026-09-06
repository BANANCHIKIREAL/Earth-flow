import type { CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "@/components/MorphIcon";
import { LostConstellations, LostPlanet } from "./LostSpaceArtwork";

// Fixed positions keep the server and browser render identical.
const STARS = Array.from({ length: 190 }, (_, index) => ({
  x: (index * 61.803 + 11) % 100,
  y: (index * 41.421 + 7) % 100,
  size: index % 9 === 0 ? 3 : index % 3 === 0 ? 2 : 1,
}));

export function NotFoundPage() {
  return (
    <div className="ef-lost">
      <title>404 — A little off orbit · Earth Flow</title>
      <meta name="robots" content="noindex" />
      <div className="ef-lost-stars" aria-hidden="true">
        {STARS.map((star, index) => (
          <i key={index} className={`${index % 9 === 0 ? "ef-lost-star--bright" : ""} ${index % 6 === 0 ? "ef-lost-star--traveler" : ""}`} style={{
            "--star-x": `${star.x}%`, "--star-y": `${star.y}%`,
            "--gather-x": `${50 + Math.cos(index * 0.7) * 19}%`,
            "--gather-y": `${43 + Math.sin(index * 0.7) * 25}%`,
            "--star-size": `${star.size}px`, "--star-delay": `${-(index % 31) * 2.5}s`,
          } as CSSProperties} />
        ))}
      </div>
      <LostConstellations />
      <div className="ef-lost-planets" aria-hidden="true">
        <LostPlanet kind="blue" />
        <LostPlanet kind="saturn" />
        <LostPlanet kind="copper" />
        <LostPlanet kind="moon" />
      </div>

      <header className="ef-lost-header">
        <Link to="/welcome" className="ef-lost-brand"><span />Earth Flow</Link>
        <span className="ef-lost-label">A SMALL DETOUR</span>
      </header>

      <main className="ef-lost-main">
        <div className="ef-lost-caption"><span /> YOU'VE DRIFTED A LITTLE FURTHER</div>
        <div className="ef-lost-scene" aria-hidden="true">
          <div className="ef-lost-guide ef-lost-guide--one" />
          <div className="ef-lost-guide ef-lost-guide--two" />
          <span className="ef-lost-digit ef-lost-digit--left">4</span>
          <div className="ef-lost-hole">
            <div className="ef-lost-halo" />
            <div className="ef-lost-core" />
            <div className="ef-lost-ring" />
            <div className="ef-lost-satellite"><i /></div>
          </div>
          <span className="ef-lost-digit ef-lost-digit--right">4</span>
          <span className="ef-lost-scene-note">NOT EVERY DETOUR IS A DISASTER.</span>
          <span className="ef-lost-cross ef-lost-cross--one">+</span>
          <span className="ef-lost-cross ef-lost-cross--two">+</span>
        </div>

        <div className="ef-lost-copy">
          <span className="ef-lost-label">404 / PAGE NOT FOUND</span>
          <h1>A little <em>off orbit.</em></h1>
          <p>This page isn't here. Take a breath.<br />Your calm corner of the internet is still waiting.</p>
          <Link to="/welcome" className="ef-lost-home">Back to Earth <ArrowRight size={17} /></Link>
        </div>
      </main>

      <footer className="ef-lost-footer">
        <span>LESS NOISE. <span>MORE SPACE.</span></span>
        <span className="ef-lost-footer-note">EVEN SPACE HAS EMPTY PAGES.</span>
      </footer>
    </div>
  );
}
