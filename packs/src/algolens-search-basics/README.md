# algolens-search-basics

Official example pack for AlgoLens. It adds one teaching course for the
`binary` (binary search) algorithm, which ships in the app without a course.

| Field | Value |
| --- | --- |
| `packId` | `algolens-search-basics` |
| `version` | `1.0.0` |
| target algorithm | `binary` |
| lessons | `lessons/binary-search.json` (`binary-search-basics`) |
| Python example | `examples/binary-search.py` |

The example is plain text inside the pack: importing it never runs code. Open
the lab, load the course example, then press **Run & visualise** to execute it
in the browser Pyodide worker and watch the teaching steps light up.

## Build

```bash
npm run pack:build          # writes packs/algolens-search-basics.algopack
npm run pack -- packs/algolens-search-basics.algopack   # validate the archive
```

Format rules live in `docs/PACK_FORMAT_V1.md`; authoring help is in
`docs/PACK_AUTHOR_GUIDE.md`.

Licensed under the MIT License — see `LICENSE`.
