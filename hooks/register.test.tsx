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
const engine = ([, on]: Env) => on('prompt.submit', (_, e) => ({ text: e.text }))
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

test('each kind of work has its own motion', async ($, on) => {
  engine([$, on])
  await submit($, 'Run nf-core/mhcquant on this sample')
  const motions = new Set<string>()

  for (const mode of ['thinking', 'responding', 'requesting', 'tool-use'] as const) {
    const ui = await $.ui.mount({ ...SPINNER, surface: 'desktop', props: { ...SPINNER.props, mode } })

    const source = String((await ui.find({ type: 'Svg' }))?.props.source)
    motions.add(source.match(/type="(\w+)" values="([^"]+)"/)?.slice(1).join(' ') ?? '')
    await ui.unmount()
  }

  expect(motions.size).toBe(4)
})

test('the terminal shows a pixel-art apple core', async ($, on) => {
  engine([$, on])
  await submit($, 'Run nf-core/mhcquant on this sample')
  const ui = await $.ui.mount({ ...SPINNER, surface: 'terminal' })

  const raster = await ui.find({ type: 'Raster', key: 'nf-core' })
  expect(raster?.props.columns).toBe(10)
  expect((await ui.find({ type: 'Text', text: /Working/ }))?.text).toBe('Working…')
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
