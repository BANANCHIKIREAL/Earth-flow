import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  DEFAULT_PROFILE_CUSTOMIZATION,
  sanitizeProfileCustomization,
  type ProfileCustomization,
} from "@/lib/profileCustomization";

export type ProfileCustomizationStatus = "idle" | "loading" | "saving" | "saved" | "error";

export function useProfileCustomization(userId: string | undefined, enabled: boolean) {
  const [customization, setCustomization] = useState<ProfileCustomization>(
    DEFAULT_PROFILE_CUSTOMIZATION,
  );
  const [status, setStatus] = useState<ProfileCustomizationStatus>("idle");
  const [dirty, setDirty] = useState(false);
  const loadId = useRef(0);
  const changeVersion = useRef(0);

  useEffect(() => {
    if (!enabled || !userId) return;
    const currentLoad = ++loadId.current;
    setStatus("loading");
    setDirty(false);

    void supabase
      .from("user_profiles")
      .select("profile_customization")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (currentLoad !== loadId.current) return;
        if (error) {
          setStatus("error");
          return;
        }
        setCustomization(sanitizeProfileCustomization(data?.profile_customization));
        setStatus("saved");
      });
  }, [enabled, userId]);

  useEffect(() => {
    if (!enabled || !userId || !dirty) return;
    setStatus("saving");
    const timer = window.setTimeout(() => {
      const versionAtSave = changeVersion.current;
      void supabase
        .from("user_profiles")
        .update({ profile_customization: customization })
        .eq("user_id", userId)
        .select("user_id")
        .single()
        .then(({ error }) => {
          if (error) {
            setStatus("error");
            return;
          }
          if (changeVersion.current === versionAtSave) {
            setStatus("saved");
            setDirty(false);
          }
        });
    }, 650);
    return () => window.clearTimeout(timer);
  }, [customization, dirty, enabled, userId]);

  const updateCustomization = useCallback(
    (patch: Partial<ProfileCustomization>) => {
      changeVersion.current += 1;
      setCustomization((current) =>
        sanitizeProfileCustomization({ ...current, ...patch }),
      );
      setDirty(true);
    },
    [],
  );

  const resetCustomization = useCallback(() => {
    changeVersion.current += 1;
    setCustomization(DEFAULT_PROFILE_CUSTOMIZATION);
    setDirty(true);
  }, []);

  return {
    customization,
    status,
    updateCustomization,
    resetCustomization,
  };
}
