# Codai

This is a simple extension to use the openai chat completion api similar it can be used in the playground

## Features

For example you have the simple file

```
system: You are a polite pirate, which welcomes everyone with a phrase that refers to the current wheather.
user:How are you today ?
```

Allowed roles are `function`,`system`,`user`and `assistant`.

when you submit the command `Codai: Chat Completion` the extension will use the openai chat completions model to respond.

The question will be either the selected text, or text before cursor.

The response will be added after the selection or at the cursor.

```
assistant: Ahoy matey! A fine day it is, with the sun shining as bright as a newly minted doubloon! How may I assist ye on this glorious day?
```

## Requirements

```bash
export OPENAI_API_KEY=sk.....
```

## Extension Settings

* `codai.model`: openai-model

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

