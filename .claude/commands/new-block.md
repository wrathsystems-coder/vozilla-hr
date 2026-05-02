---
description: Scaffold a new Lexical custom block for Payload editor
argument-hint: <name> (e.g. /new-block ProsConsTable)
---

# /new-block

Create a new Lexical custom block for the Payload Lexical editor:

1. Define block schema in `apps/web/payload/blocks/{name}.ts`
2. Create React component in `apps/web/components/blocks/{name}.tsx`
3. Register in Lexical config
4. Add to allowed `blocks` list for the relevant collections
5. Test in Payload editor: add an instance, render on a public page
6. Update `docs/content-editing.md` with block usage notes
