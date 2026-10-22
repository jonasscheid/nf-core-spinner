import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import { CORE, STALK } from './logo'
import { frameCells, ROWS, WIDTH, type Mode } from './pixels'

const TRIGGER = /nf-?core/i
const isActive = atom({ plugin: 'nf-core-spinner', key: 'isActive' } as const, false)

const TICK_MS = 150
const RASTER_KEY = 'nf-core'

type Animation = { mode: Mode; tick: number; misses: number }
// A row that refuses this many blits in a row is gone, so its timer stops.
const MAX_MISSES = 20
const animations = new Map<string, Animation>()

const NF_GREEN = '#22ae63'
const BASE = '141 275'
const STALK_BASE = '150 75'
const CENTER_X = 141.6
const CENTER_Y = 160

const animate = (type: string, values: string, dur: string, extra = '') =>
  `<animateTransform attributeName="transform" type="${type}" values="${values}" dur="${dur}" repeatCount="indefinite" ${extra}/>`

// Scale about a point: SMIL replaces the element's transform, so the shift sits on wrapper groups.
const scaleAbout = (x: number, y: number, motion: string, content: string) =>
  `<g transform="translate(${x} ${y})"><g>${motion}<g transform="translate(${-x} ${-y})">${content}</g></g></g>`

const rock = (content: string) =>
  `<g>${animate('rotate', `-7 ${BASE};7 ${BASE};-7 ${BASE}`, '1.33s', 'calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"')}${content}</g>`

const hop = (content: string) =>
  `<g>${animate('translate', '0 0;0 -22;0 0;0 0', '0.67s', 'keyTimes="0;.35;.7;1" calcMode="spline" keySplines=".2 .6 .4 1;.6 0 .8 .4;0 0 1 1"')}${content}</g>`

const flip = (content: string) =>
  scaleAbout(CENTER_X, 0, animate('scale', '1 1;-1 1;1 1', '1.33s', 'calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"'), content)

const pulse = (content: string) =>
  scaleAbout(CENTER_X, CENTER_Y, animate('scale', '1;1.12;1;1.07;1;1', '0.83s', 'keyTimes="0;.15;.3;.45;.6;1"'), content)

const MOTIONS: Record<Mode, (content: string) => string> = {
  thinking: rock,
  responding: flip,
  requesting: pulse,
  'tool-input': hop,
  'tool-use': hop,
}

const stalkMotion = animate('rotate', `-10 ${STALK_BASE};10 ${STALK_BASE};-10 ${STALK_BASE}`, '0.92s')

const nfCoreSvg = (mode: Mode) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-23 -30 330 330" width="64" height="64">` +
  `${MOTIONS[mode](`${CORE}<g>${stalkMotion}${STALK}</g>`)}</svg>`

export const register: Register = on => {
  on('prompt.submit', async ($, e, next) => {
    if (TRIGGER.test(e.text) && !(await read($, isActive))) {
      await update($, isActive, () => true)
    }

    return next(e)
  })

  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    if (!(await read($, isActive))) {
      return next(e)
    }

    const label = e.props.message ?? e.props.word

    if (e.surface === 'terminal') {
      const { requestId } = e
      const running = animations.get(requestId)
      const animation: Animation = running ?? { mode: e.props.mode, tick: 0, misses: 0 }
      animation.mode = e.props.mode

      if (!running) {
        const timer = $.clock.every(TICK_MS, async () => {
          animation.tick = animation.tick + 1
          const cells = frameCells(animation.mode, animation.tick)
          const result = await $.ui.blit({ requestId, key: RASTER_KEY, cells })
          animation.misses = 'deny' in result && result.deny ? animation.misses + 1 : 0
          if (animation.misses >= MAX_MISSES) {
            timer.cancel()
            animations.delete(requestId)
          }
        })
        animations.set(requestId, animation)
      }

      const { Box, Raster, Text } = $.ui.resolve(e)

      return (
        <Box flexDirection="row" alignItems="center" gap={1}>
          <Raster
            key={RASTER_KEY}
            columns={WIDTH}
            rows={ROWS}
            cells={frameCells(animation.mode, animation.tick)}
          />
          <Text color={NF_GREEN}>
            {label}
            {e.props.suffix}
          </Text>
        </Box>
      )
    }

    const { Box, Svg, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="row" alignItems="center" gap={1}>
        <Svg
          source={nfCoreSvg(e.props.mode)}
          alt="nf-core logo"
          width={20}
          height={20}
          isInteractive
        />
        <Text color={NF_GREEN}>
          {label}
          {e.props.suffix}
        </Text>
      </Box>
    )
  })
}
