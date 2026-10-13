/** Server-only: feature-flag + site-config extension for the study platform. */
import { getSiteConfig } from "../site-config";
import { DEFAULT_STUDY_PLATFORM_CONFIG, type StudyPlatformConfig } from "./types";

export async function getStudyPlatformConfig(): Promise<StudyPlatformConfig> {
  try {
    const cfg = await getSiteConfig();
    const raw = (cfg as unknown as { studyPlatform?: Partial<StudyPlatformConfig> }).studyPlatform;
    if (!raw) return DEFAULT_STUDY_PLATFORM_CONFIG;
    return {
      enabled: raw.enabled ?? DEFAULT_STUDY_PLATFORM_CONFIG.enabled,
      demoMode: raw.demoMode ?? true,
      flags: { ...DEFAULT_STUDY_PLATFORM_CONFIG.flags, ...(raw.flags ?? {}) },
    };
  } catch {
    return DEFAULT_STUDY_PLATFORM_CONFIG;
  }
}

export async function isStudyPlatformEnabled(): Promise<boolean> {
  const c = await getStudyPlatformConfig();
  return c.enabled || c.flags["study-platform"]?.enabled === true;
}
