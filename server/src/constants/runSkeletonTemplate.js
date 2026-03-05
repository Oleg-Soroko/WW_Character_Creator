export const RUN_ANIMATION_NAME = 'run'

// Normalized motion multipliers for one run cycle.
// PixelLab animate-with-skeleton currently expects exactly 3 pose keyframes.
export const RUN_SKELETON_TEMPLATE = [
  { leftArmX: -1.0, leftArmY: 0.35, rightArmX: 1.0, rightArmY: -0.35, leftLegX: 1.0, leftLegY: -0.5, rightLegX: -1.0, rightLegY: 0.5, torsoY: -0.12 },
  { leftArmX: 0.0, leftArmY: 0.0, rightArmX: 0.0, rightArmY: 0.0, leftLegX: 0.0, leftLegY: 0.0, rightLegX: 0.0, rightLegY: 0.0, torsoY: 0.18 },
  { leftArmX: 1.0, leftArmY: -0.35, rightArmX: -1.0, rightArmY: 0.35, leftLegX: -1.0, leftLegY: 0.5, rightLegX: 1.0, rightLegY: -0.5, torsoY: 0.02 },
]
