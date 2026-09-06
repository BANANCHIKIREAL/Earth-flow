import {
  Check,
  Eye,
  Layers3,
  Palette,
  RotateCcw,
  Sparkles,
  WandSparkles,
} from "@/components/MorphIcon";
import {
  PROFILE_ACCENTS,
  PROFILE_MOODS,
  type ProfileBanner,
  type ProfileCustomization,
  type ProfileFrame,
  type ProfileScene,
  type ProfileSurface,
} from "@/lib/profileCustomization";
import { ProfileMoodIcon } from "@/components/ProfileMoodIcon";

interface Props {
  value: ProfileCustomization;
  onChange: (patch: Partial<ProfileCustomization>) => void;
  onReset: () => void;
}

const SCENES: { id: ProfileScene; label: string; note: string }[] = [
  { id: "cosmic", label: "Cosmic", note: "Deep blue starlight" },
  { id: "aurora", label: "Aurora", note: "Mint and violet haze" },
  { id: "ocean", label: "Ocean", note: "Cold tidal glow" },
  { id: "ember", label: "Ember", note: "Warm volcanic glass" },
  { id: "dusk", label: "Dusk", note: "Rose twilight" },
  { id: "noir", label: "Noir", note: "Quiet monochrome" },
];

const BANNERS: { id: ProfileBanner; label: string }[] = [
  { id: "nebula", label: "Nebula" },
  { id: "aurora", label: "Aurora" },
  { id: "sunrise", label: "Sunrise" },
  { id: "waves", label: "Waves" },
  { id: "eclipse", label: "Eclipse" },
  { id: "prism", label: "Prism" },
];

const FRAMES: { id: ProfileFrame; label: string }[] = [
  { id: "clean", label: "Clean" },
  { id: "halo", label: "Halo" },
  { id: "orbit", label: "Orbit" },
  { id: "double", label: "Double" },
  { id: "prism", label: "Prism" },
];

const SURFACES: { id: ProfileSurface; label: string }[] = [
  { id: "glass", label: "Glass" },
  { id: "midnight", label: "Midnight" },
  { id: "velvet", label: "Velvet" },
  { id: "frost", label: "Frost" },
];

function Toggle({
  checked,
  label,
  note,
  onChange,
}: {
  checked: boolean;
  label: string;
  note: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`profile-custom-toggle-row ${checked ? "is-on" : ""}`}
      aria-pressed={checked}
    >
      <span>
        <span className="profile-custom-toggle-title">{label}</span>
        <span className="profile-custom-toggle-note">{note}</span>
      </span>
      <span className="profile-custom-switch"><i /></span>
    </button>
  );
}

export function ProfileCustomizationPanel({ value, onChange, onReset }: Props) {
  return (
    <div className="profile-custom-layout ef-pm-tab">
      <div className="profile-custom-hero">
        <div>
          <div className="profile-settings-eyebrow">PROFILE STUDIO</div>
          <div className="profile-custom-title">Make it unmistakably yours.</div>
          <div className="profile-custom-copy">
            Every change appears live above and follows you across devices.
          </div>
        </div>
      </div>

      <section className="profile-custom-section">
        <div className="profile-custom-section-head">
          <span><WandSparkles size={13} /></span>
          <div><b>Atmosphere</b><small>Choose the entire profile scene</small></div>
        </div>
        <div className="profile-custom-scene-grid">
          {SCENES.map((scene) => (
            <button
              key={scene.id}
              type="button"
              onClick={() => onChange({ scene: scene.id })}
              className={`profile-custom-scene profile-scene-swatch-${scene.id} ${value.scene === scene.id ? "is-active" : ""}`}
            >
              <i />
              <span><b>{scene.label}</b><small>{scene.note}</small></span>
              {value.scene === scene.id && <Check size={11} />}
            </button>
          ))}
        </div>
      </section>

      <section className="profile-custom-section">
        <div className="profile-custom-section-head">
          <span><Sparkles size={13} /></span>
          <div><b>Fine tuning</b><small>Control scene visibility and definition</small></div>
        </div>
        <label className="profile-custom-range">
          <span><b>Atmosphere depth</b><em>{value.sceneDepth}%</em></span>
          <input
            type="range"
            min="0"
            max="100"
            value={value.sceneDepth}
            onChange={(event) => onChange({ sceneDepth: Number(event.target.value) })}
          />
        </label>
        <label className="profile-custom-range">
          <span><b>Border definition</b><em>{value.borderStrength}%</em></span>
          <input
            type="range"
            min="0"
            max="100"
            value={value.borderStrength}
            onChange={(event) => onChange({ borderStrength: Number(event.target.value) })}
          />
        </label>
      </section>

      <section className="profile-custom-section">
        <div className="profile-custom-section-head">
          <span><Palette size={13} /></span>
          <div><b>Signature color</b><small>Controls borders, light and details</small></div>
        </div>
        <div className="profile-custom-colors">
          {PROFILE_ACCENTS.map((accent) => (
            <button
              key={accent}
              type="button"
              aria-label={`Use ${accent}`}
              onClick={() => onChange({ accent })}
              className={value.accent === accent ? "is-active" : ""}
              style={{ background: accent }}
            >
              {value.accent === accent && <Check size={10} />}
            </button>
          ))}
          <label className="profile-custom-color-picker" title="Custom color">
            <input
              type="color"
              value={value.accent}
              onChange={(event) => onChange({ accent: event.target.value })}
            />
            <Sparkles size={12} />
          </label>
        </div>
        <label className="profile-custom-range">
          <span><b>Glow intensity</b><em>{value.glow}%</em></span>
          <input
            type="range"
            min="0"
            max="100"
            value={value.glow}
            onChange={(event) => onChange({ glow: Number(event.target.value) })}
          />
        </label>
      </section>

      <section className="profile-custom-section">
        <div className="profile-custom-section-head">
          <span><Layers3 size={13} /></span>
          <div><b>Visual architecture</b><small>Layer the banner, frame and material</small></div>
        </div>
        <div className="profile-custom-label">Banner</div>
        <div className="profile-custom-choice-grid profile-custom-banner-grid">
          {BANNERS.map((banner) => (
            <button
              key={banner.id}
              type="button"
              onClick={() => onChange({ banner: banner.id })}
              className={value.banner === banner.id ? "is-active" : ""}
            >
              <i className={`profile-banner-swatch-${banner.id}`} />
              {banner.label}
            </button>
          ))}
        </div>
        <div className="profile-custom-label">Avatar frame</div>
        <div className="profile-custom-choice-grid">
          {FRAMES.map((frame) => (
            <button
              key={frame.id}
              type="button"
              onClick={() => onChange({ frame: frame.id })}
              className={value.frame === frame.id ? "is-active" : ""}
            >
              <i className={`profile-frame-swatch-${frame.id}`} />
              {frame.label}
            </button>
          ))}
        </div>
        <div className="profile-custom-label">Surface</div>
        <div className="profile-custom-choice-grid profile-custom-surface-grid">
          {SURFACES.map((surface) => (
            <button
              key={surface.id}
              type="button"
              onClick={() => onChange({ surface: surface.id })}
              className={value.surface === surface.id ? "is-active" : ""}
            >
              {surface.label}
            </button>
          ))}
        </div>
      </section>

      <section className="profile-custom-section">
        <div className="profile-custom-section-head">
          <span><Sparkles size={13} /></span>
          <div><b>Identity details</b><small>Add your own words and mood symbol</small></div>
        </div>
        <label className="profile-custom-input">
          <span>Profile title <em>{value.title.length}/32</em></span>
          <input
            value={value.title}
            maxLength={32}
            placeholder="Deep work explorer"
            onChange={(event) => onChange({ title: event.target.value })}
          />
        </label>
        <label className="profile-custom-input">
          <span>Short note <em>{value.bio.length}/90</em></span>
          <textarea
            value={value.bio}
            maxLength={90}
            rows={2}
            placeholder="A small line about your current focus."
            onChange={(event) => onChange({ bio: event.target.value })}
          />
        </label>
        <div className="profile-custom-label">Mood symbol</div>
        <div className="profile-custom-moods">
          {Object.entries(PROFILE_MOODS).map(([id, mood]) => (
            <button
              key={id}
              type="button"
              onClick={() => onChange({ mood: id as ProfileCustomization["mood"] })}
              className={value.mood === id ? "is-active" : ""}
              title={mood.label}
            >
              <b><ProfileMoodIcon mood={id as ProfileCustomization["mood"]} /></b>
              <small>{mood.label}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="profile-custom-section">
        <div className="profile-custom-section-head">
          <span><Eye size={13} /></span>
          <div><b>Presence & privacy</b><small>Decide what your profile reveals</small></div>
        </div>
        <div className="profile-custom-toggles">
          <Toggle checked={value.motion} label="Ambient motion" note="Slow scene and frame movement" onChange={(motion) => onChange({ motion })} />
          <Toggle checked={value.particles} label="Light particles" note="Subtle points of light in the header" onChange={(particles) => onChange({ particles })} />
          <Toggle checked={value.showEmail} label="Show email" note="Display your email inside the profile" onChange={(showEmail) => onChange({ showEmail })} />
          <Toggle checked={value.showMemberId} label="Show member number" note="Display your Earth Flow member ID" onChange={(showMemberId) => onChange({ showMemberId })} />
          <Toggle checked={value.showMemberSince} label="Show member since" note="Display your registration date" onChange={(showMemberSince) => onChange({ showMemberSince })} />
        </div>
      </section>

      <button type="button" onClick={onReset} className="profile-custom-reset">
        <RotateCcw size={12} /> Restore the original profile style
      </button>
    </div>
  );
}
