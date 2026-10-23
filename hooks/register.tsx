import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { MotionIndex } from '../types'
import { CORE, STALK } from './logo'

const TRIGGER = /nf-?core/i
const isActive = atom({ plugin: 'nf-core-spinner', key: 'isActive' } as const, false)
const motionIndex = atom({ plugin: 'nf-core-spinner', key: 'motionIndex' } as const, 0 as MotionIndex)

const NF_GREEN = '#22ae63'
const BASE = '141 275'
const STALK_BASE = '150 75'
const CENTER_X = 141.6
const CENTER_Y = 160
const VIEW_WIDTH = 330

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

// The nf-core-scroll Slack emoji: the logo slides right and wraps in from the left.
const scroll = (content: string) =>
  `<g>${animate('translate', `0 0;${VIEW_WIDTH} 0`, '0.4s')}${content}<g transform="translate(${-VIEW_WIDTH} 0)">${content}</g></g>`

// Each prompt takes the next motion and keeps it for the whole response.
const MOTIONS = [rock, flip, pulse, hop, scroll] as const

const stalkMotion = animate('rotate', `-10 ${STALK_BASE};10 ${STALK_BASE};-10 ${STALK_BASE}`, '0.92s')

const nfCoreSvg = (index: MotionIndex) => {
  const motion = MOTIONS[index % MOTIONS.length] ?? rock

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-23 -30 ${VIEW_WIDTH} ${VIEW_WIDTH}" width="64" height="64">` +
    `${motion(`${CORE}<g>${stalkMotion}${STALK}</g>`)}</svg>`
  )
}

export const register: Register = on => {
  on('prompt.submit', async ($, e, next) => {
    if (TRIGGER.test(e.text) && !(await read($, isActive))) {
      await update($, isActive, () => true)
    }
    await update($, motionIndex, i => (i + 1) % MOTIONS.length)

    return next(e)
  })

  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    if (e.surface === 'terminal' || !(await read($, isActive))) {
      return next(e)
    }

    const { Box, Svg, Text } = $.ui.resolve(e)
    const label = e.props.message ?? e.props.word

    return (
      <Box flexDirection="row" alignItems="center" gap={1}>
        <Svg
          source={nfCoreSvg(await read($, motionIndex))}
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
