# nf-core-spinner

A Claude Code plugin that replaces the Claude working mark with an animated nf-core apple core.

## Preview

Claude desktop app and VS Code:

![Animated nf-core logo in the app](assets/preview-app.svg)

Terminal:

![Pixel-art nf-core logo in the terminal](assets/preview-terminal.gif)

Each kind of work has its own motion:

| Claude is | Motion |
| --- | --- |
| Thinking | Rock |
| Writing a reply | Flip |
| Waiting for the model | Pulse |
| Running a tool | Hop |

The logo appears after the first prompt in a session that mentions nf-core.
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

- The terminal version needs a terminal with true color.
- The working row no longer shows the elapsed time and the token count.

## Credits

The logo comes from [nf-core/logos](https://github.com/nf-core/logos) (MIT license).
