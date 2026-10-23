import { expect, test } from 'claude-code/testing'

const SPINNER = {
  plugin: 'nf-core-spinner',
  component: 'Spinner',
  requestId: 'main',
  props: { word: 'Working', message: null, suffix: '…', mode: 'thinking' },
} as const

type TestBody = Extract<Parameters<typeof test>[1], Function>
type Env = Parameters<TestBody>

// Stands for the engine beneath the plugin; registered before the test first calls `$`.
const engine = ([, on]: Env, files: string[] = []) => {
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.root', () => ({ value: '/work/repo/sub' }))
  on('fs.exists', (_, e) => ({ value: files.includes(e.path) }))
  on('prompt.submit', (_, e) => ({ text: e.text }))
}
const submit = ($: Env[0], text: string) => $.prompt.submit({ text, wait: false, origin: { kind: 'composer' } })

test('the working row shows the nf-core logo on remote surfaces', async ($, on) => {
  engine([$, on])
  await submit($, 'Run nf-core/mhcquant on this sample')
  for (const surface of ['desktop', 'vscode', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...SPINNER, surface })

    const logo = await ui.find({ type: 'Svg' })

    expect(logo?.props.alt).toBe('nf-core logo')
    expect(String(logo?.props.source)).toContain('animateTransform')
    expect((await ui.find({ type: 'Text', text: /Working/ }))?.text).toBe('Working…')
    await ui.unmount()
  }
})

const motionOf = async ($: Env[0], mode: 'thinking' | 'responding' | 'requesting' | 'tool-use') => {
  const ui = await $.ui.mount({ ...SPINNER, surface: 'desktop', props: { ...SPINNER.props, mode } })
  const source = String((await ui.find({ type: 'Svg' }))?.props.source)
  await ui.unmount()

  return source.match(/type="(\w+)" values="([^"]+)"/)?.slice(1).join(' ')
}

test('one response keeps one motion, the next prompt takes another', async ($, on) => {
  engine([$, on])
  await submit($, 'Run nf-core/mhcquant on this sample')

  const first = await motionOf($, 'thinking')
  for (const mode of ['responding', 'requesting', 'tool-use'] as const) {
    expect(await motionOf($, mode)).toBe(first)
  }

  await submit($, 'And now nf-core/epitopeprediction')
  expect(await motionOf($, 'thinking')).not.toBe(first)
})

test('the terminal keeps its own spinner', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>engine</Text>
  })
  engine([$, on])
  await submit($, 'Run nf-core/mhcquant on this sample')

  const ui = await $.ui.mount({ ...SPINNER, surface: 'terminal' })
  expect((await ui.find({ type: 'Text', text: /engine/ }))?.text).toBe('engine')
  await ui.unmount()
})

test('the engine mark stays until a prompt mentions nf-core', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>engine</Text>
  })
  engine([$, on])
  await submit($, 'Fix the typo in the README')

  const before = await $.ui.mount({ ...SPINNER, surface: 'desktop' })
  expect(await before.find({ type: 'Svg' })).toBeUndefined()
  await before.unmount()

  await submit($, 'Now bump the nf-core template')
  await submit($, 'Thanks')

  const after = await $.ui.mount({ ...SPINNER, surface: 'desktop' })
  expect(await after.find({ type: 'Svg' })).toBeDefined()
  await after.unmount()
})

test('an nf-core repo shows the logo without a prompt naming nf-core', async ($, on) => {
  engine([$, on], ['/work/repo/.nf-core.yml'])
  await submit($, 'Fix the typo in the README')

  const ui = await $.ui.mount({ ...SPINNER, surface: 'desktop' })
  expect((await ui.find({ type: 'Svg' }))?.props.alt).toBe('nf-core logo')
  await ui.unmount()
})

test('an nf-core repo shows the logo from the session start, before any prompt', async ($, on) => {
  engine([$, on], ['/work/repo/.nf-core.yml'])
  await $.session.start({ cwd: '/work/repo/sub', surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount({ ...SPINNER, surface: 'desktop' })
  expect((await ui.find({ type: 'Svg' }))?.props.alt).toBe('nf-core logo')
  await ui.unmount()
})
