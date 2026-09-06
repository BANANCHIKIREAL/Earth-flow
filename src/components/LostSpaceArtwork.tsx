import { useId } from "react";

// Bright-star coordinates in degrees, from d3-celestial's constellation lines:
// https://github.com/ofrohn/d3-celestial/blob/master/data/constellations.lines.json
// Each group is projected separately for an illustrative layout, not a live sky map.
const CONSTELLATIONS = [
  { id: "ursa", name: "URSA MAJOR", coordinates: [[183.8565,57.0326],[165.932,61.751],[165.4603,56.3824],[178.4577,53.6948],[193.5073,55.9598],[200.9814,54.9254],[206.8852,49.3133]], lines: [[0,1,2,3,0,4,5,6]] },
  { id: "cassiopeia", name: "CASSIOPEIA", coordinates: [[28.5989,63.6701],[21.454,60.2353],[14.1772,60.7167],[10.1268,56.5373],[2.2945,59.1498]], lines: [[0,1,2,3,4]] },
  { id: "orion", name: "ORION", coordinates: [[78.6345,-8.2016],[81.1192,-2.3971],[83.0017,-.2991],[81.2828,6.3497],[83.7845,9.9342],[88.7929,7.4071],[85.1897,-1.9426],[86.9391,-9.6696],[84.0534,-1.2019]], lines: [[0,1,2,3,4,5,6,7],[2,8,6]] },
].map((group) => {
  const dec = group.coordinates.reduce((sum, point) => sum + point[1], 0) / group.coordinates.length;
  const points = group.coordinates.map(([ra, d]) => [-ra * Math.cos(dec * Math.PI / 180), -d]);
  const minX = Math.min(...points.map(p => p[0]));
  const minY = Math.min(...points.map(p => p[1]));
  const scale = Math.min(190 / (Math.max(...points.map(p => p[0])) - minX), 130 / (Math.max(...points.map(p => p[1])) - minY));
  return { ...group, points: points.map(([x,y]) => [25 + (x-minX)*scale, 20 + (y-minY)*scale]) };
});

export function LostConstellations() {
  return <div className="ef-lost-constellations" aria-hidden="true">
    {CONSTELLATIONS.map(group => <svg key={group.id} className={`ef-lost-constellation ef-lost-constellation--${group.id}`} viewBox="0 0 240 180">
      {group.lines.map((line,index) => <polyline key={index} points={line.map(i=>group.points[i].join(",")).join(" ")} fill="none" stroke="#a9c9ed" strokeOpacity=".23" strokeWidth=".65" />)}
      {group.points.map(([x,y],index) => <g key={index}>
        <circle cx={x} cy={y} r="6" fill="#b8ddff" opacity=".045" />
        <circle cx={x} cy={y} r="3.4" fill="#b8ddff" opacity=".13" />
        <circle cx={x} cy={y} r={index % 3 === 0 ? 1.7 : 1.15} fill={group.id === "orion" && index === 5 ? "#ffd0ab" : "#e4efff"} />
      </g>)}
      <text x="25" y="173">{group.name}</text>
    </svg>)}
  </div>;
}

const PALETTES = {
  blue: ["#427b9b", "#7f9980", "#c5e5ef"],
  saturn: ["#b4a18b", "#7e6554", "#ead4b0"],
  copper: ["#9d5039", "#40251f", "#d9ac80"],
  moon: ["#949ca5", "#404752", "#cdd2d5"],
};

export function LostPlanet({ kind }: { kind: keyof typeof PALETTES }) {
  const id = useId().replace(/:/g, "");
  const [base, terrain, light] = PALETTES[kind];
  const ring = kind === "saturn";
  return <div className={`ef-lost-planet ef-lost-planet--${kind}`}>
    <svg className="ef-lost-planet-art" viewBox="0 0 200 200" fill="none">
      <defs>
        <clipPath id={`${id}-clip`}><circle cx="100" cy="100" r="60" /></clipPath>
        <radialGradient id={`${id}-base`} cx="30%" cy="25%" r="85%">
          <stop stopColor={light} /><stop offset=".32" stopColor={base} /><stop offset="1" stopColor="#05080d" />
        </radialGradient>
        <radialGradient id={`${id}-shade`} cx="25%" cy="28%" r="78%">
          <stop offset=".15" stopColor="#000" stopOpacity="0" /><stop offset=".48" stopColor="#000" stopOpacity=".08" /><stop offset=".76" stopColor="#000" stopOpacity=".64" /><stop offset="1" stopColor="#000" stopOpacity=".98" />
        </radialGradient>
        <filter id={`${id}-surface`} x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency={ring ? ".025 .2" : ".047"} numOctaves="4" seed={kind === "blue" ? 12 : 7} />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer><feFuncA type="linear" slope=".7" /></feComponentTransfer>
          <feBlend in2="SourceGraphic" mode="soft-light" />
        </filter>
        <filter id={`${id}-clouds`} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency=".017 .055" numOctaves="4" seed="16" />
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 5 -2.8" />
        </filter>
      </defs>
      {ring && <g transform="rotate(-25 100 100)" stroke={light}>
        <ellipse cx="100" cy="100" rx="94" ry="25" strokeWidth="11" opacity=".28" />
        <ellipse cx="100" cy="100" rx="83" ry="22" strokeWidth="4" opacity=".45" />
        <ellipse cx="100" cy="100" rx="99" ry="27" strokeWidth=".8" opacity=".5" />
      </g>}
      <circle cx="100" cy="100" r="60" fill={`url(#${id}-base)`} />
      <g clipPath={`url(#${id}-clip)`}>
        <circle cx="100" cy="100" r="60" fill={base} filter={`url(#${id}-surface)`} />
        {kind === "blue" && <>
          <path d="M62 40 87 47 81 58 94 69 83 80 88 90 77 103 78 124 68 137 63 116 52 108 54 89 40 77 46 51ZM125 48 148 56 162 82 145 92 130 86 134 71 115 65ZM133 117 145 108 159 117 149 137 130 140 120 132Z" fill={terrain} opacity=".8" filter={`url(#${id}-surface)`} />
          <circle cx="100" cy="100" r="60" filter={`url(#${id}-clouds)`} opacity=".65" />
        </>}
        {ring && Array.from({length:15},(_,i)=><path key={i} d={`M35 ${47+i*7} Q100 ${65+i*7} 165 ${48+i*7}`} stroke={i%2 ? light : terrain} strokeWidth={i%3+1} opacity=".28" />)}
        {kind === "moon" && [[76,74,10],[111,63,6],[122,116,15],[73,130,7],[94,99,5]].map(([x,y,r])=><g key={x}><circle cx={x} cy={y} r={r} fill={terrain} opacity=".45" /><circle cx={x-1} cy={y-1} r={r} stroke={light} strokeWidth=".8" opacity=".3" /></g>)}
        <circle cx="100" cy="100" r="60" fill={`url(#${id}-shade)`} />
      </g>
      <path d="M44 119A60 60 0 0 1 119 43" stroke={light} strokeWidth={kind === "blue" ? "1.5" : ".6"} opacity=".55" />
      {ring && <g transform="rotate(-25 100 100)" stroke={light}>
        <path d="M6 100a94 25 0 0 0 188 0" strokeWidth="10" opacity=".42" />
        <path d="M17 100a83 22 0 0 0 166 0" strokeWidth="3" opacity=".65" />
        <path d="M1 100a99 27 0 0 0 198 0" strokeWidth=".8" opacity=".55" />
      </g>}
    </svg>
  </div>;
}
