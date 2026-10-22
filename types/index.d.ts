export type IsActive = boolean
export type MotionIndex = number

declare module 'claude-code' {
  interface PluginState {
    'nf-core-spinner': { isActive: IsActive; motionIndex: MotionIndex }
  }
}
