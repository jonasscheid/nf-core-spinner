export type IsActive = boolean

declare module 'claude-code' {
  interface PluginState {
    'nf-core-spinner': { isActive: IsActive }
  }
}
