/**
 * Tempest Client - Cinematic Loading Screen
 * Scene Configuration & Asset Management
 *
 * Central, configurable scene sequence using all 13 existing sky images.
 * Visual progression: clear day → fluffy clouds → gathering clouds → storm → rain → sunset → night → sunrise
 */

export const SCENE_CONFIG = [
  {
    id: 'clear_day',
    imageUrl: 'assets/clearsky.jpeg',
    label: 'Clear sky',
    duration: 4000, // ms display time
    transitionDuration: 1200,
    intensity: 'light',
    effects: ['gentle-drift'],
    minProgress: 0,
    maxProgress: 12,
  },
  {
    id: 'fluffy_clouds',
    imageUrl: 'assets/fluffyclouds.jpg',
    label: 'Fair weather',
    duration: 3500,
    transitionDuration: 1400,
    intensity: 'light',
    effects: ['gentle-drift'],
    minProgress: 12,
    maxProgress: 22,
  },
  {
    id: 'cloudy_sky',
    imageUrl: 'assets/cloudysky.jpeg',
    label: 'Gathering clouds',
    duration: 3800,
    transitionDuration: 1200,
    intensity: 'medium',
    effects: ['subtle-zoom'],
    minProgress: 22,
    maxProgress: 32,
  },
  {
    id: 'big_clouds',
    imageUrl: 'assets/bigclouds.jpg',
    label: 'Clouds thickening',
    duration: 4000,
    transitionDuration: 1300,
    intensity: 'medium',
    effects: ['subtle-zoom'],
    minProgress: 32,
    maxProgress: 42,
  },
  {
    id: 'storm_coming',
    imageUrl: 'assets/stormcoming.jpg',
    label: 'Storm approaching',
    duration: 3500,
    transitionDuration: 1200,
    intensity: 'high',
    effects: ['subtle-lightning'],
    minProgress: 42,
    maxProgress: 52,
  },
  {
    id: 'storm_clouds',
    imageUrl: 'assets/stormclouds.jpg',
    label: 'Storm overhead',
    duration: 3800,
    transitionDuration: 1400,
    intensity: 'high',
    effects: ['subtle-lightning', 'color-cool'],
    minProgress: 52,
    maxProgress: 62,
  },
  {
    id: 'rain_clouds',
    imageUrl: 'assets/rainclouds.jpg',
    label: 'Heavy rain',
    duration: 5000, // longer for rain effect to settle
    transitionDuration: 1500,
    intensity: 'very-high',
    effects: ['rain-glass-overlay', 'water-droplets'],
    rainGlassActive: true, // CRITICAL: activates animated wet glass only here
    minProgress: 62,
    maxProgress: 75,
  },
  {
    id: 'sunset_sky',
    imageUrl: 'assets/sunsetsky.jpg',
    label: 'Sunset',
    duration: 4200,
    transitionDuration: 1600,
    intensity: 'medium-low',
    effects: ['warm-shift'],
    minProgress: 75,
    maxProgress: 85,
  },
  {
    id: 'night_sky',
    imageUrl: 'assets/nightsky.jpeg',
    label: 'Deep night',
    duration: 3800,
    transitionDuration: 1400,
    intensity: 'low',
    effects: ['subtle-stars'],
    minProgress: 85,
    maxProgress: 91,
  },
  {
    id: 'starry_sky',
    imageUrl: 'assets/starrysky.jpg',
    label: 'Starlight',
    duration: 3500,
    transitionDuration: 1200,
    intensity: 'low',
    effects: ['subtle-stars'],
    minProgress: 91,
    maxProgress: 95,
  },
  {
    id: 'half_moon',
    imageUrl: 'assets/halfmoon.jpg',
    label: 'Moonrise',
    duration: 3200,
    transitionDuration: 1200,
    intensity: 'low',
    effects: ['subtle-stars'],
    minProgress: 95,
    maxProgress: 98,
  },
  {
    id: 'morning_moon',
    imageUrl: 'assets/morningmoon.jpg',
    label: 'Early dawn',
    duration: 3500,
    transitionDuration: 1400,
    intensity: 'low-medium',
    effects: ['warm-shift'],
    minProgress: 98,
    maxProgress: 101,
  },
  {
    id: 'sunrise_sky',
    imageUrl: 'assets/sunrisesky.jpg',
    label: 'Sunrise',
    duration: 4000,
    transitionDuration: 1500,
    intensity: 'medium',
    effects: ['warm-shift', 'gentle-drift'],
    minProgress: 101,
    maxProgress: 110,
  },
];

/**
 * Compute total sequence duration (all scenes + transitions)
 */
export function getTotalSequenceDuration() {
  return SCENE_CONFIG.reduce((sum, scene) => sum + scene.duration + scene.transitionDuration, 0);
}

/**
 * Find the scene that matches a given progress percentage
 */
export function getSceneByProgress(progress) {
  return SCENE_CONFIG.find((scene) => progress >= scene.minProgress && progress <= scene.maxProgress) || SCENE_CONFIG[0];
}

/**
 * Get the next scene in the sequence
 */
export function getNextScene(currentSceneId) {
  const currentIndex = SCENE_CONFIG.findIndex((s) => s.id === currentSceneId);
  if (currentIndex === -1 || currentIndex === SCENE_CONFIG.length - 1) {
    return SCENE_CONFIG[0];
  }
  return SCENE_CONFIG[currentIndex + 1];
}

/**
 * Check if rain glass overlay should be active
 * CRITICAL: Only active during rainclouds.jpg scene
 */
export function isRainGlassActive(sceneId) {
  const scene = SCENE_CONFIG.find((s) => s.id === sceneId);
  return scene ? scene.rainGlassActive === true : false;
}

export default SCENE_CONFIG;
