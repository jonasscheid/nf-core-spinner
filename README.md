# nf-core-spinner

A Claude Code plugin that replaces the Claude working mark with an animated nf-core apple core.

## Preview

![Animated nf-core logo in the app](assets/preview-app.svg)

The plugin has five motions: rock, flip, pulse, hop and scroll.
Each prompt takes the next motion and keeps it for the whole response.

The logo appears from the first prompt in an nf-core repository (a folder with `.nf-core.yml` at or above the project root).
Elsewhere, it appears after the first prompt that mentions nf-core.
Before that, Claude Code shows its own mark.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install nf-core-spinner --marketplace jonasscheid/nf-core-spinner
```

From a shell:

```bash
claude plugin install nf-core-spinner --marketplace jonasscheid/nf-core-spinner
```

Enter `y` to add the marketplace, then select a scope.
A plugin installed at the user scope also loads in the Code tab of the Claude desktop app.

## Notes

- The logo shows in the Claude desktop app and in VS Code. The terminal keeps its own spinner.
- The working row no longer shows the elapsed time and the token count.

## Credits

The logo comes from [nf-core/logos](https://github.com/nf-core/logos) (MIT license).
