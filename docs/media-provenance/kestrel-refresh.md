# KESTREL motion-led refresh — 2026-10-13

Owner request: remove stale interface-led marketing and restore real video and premium assets. Preserve the established Ceradon visual identity.

- Hero: `kestrel-orbit-90.mp4` and its poster, retained from upstream commit `6017111354c8bc82b5a7e061fef219a6654809e9`. The poster visibly carries a v0.44.0-alpha watermark; the page uses the neutral label ?Recorded simulator view?. The source filename/commit describes an orbit, but no recording-control provenance establishes human piloting or aircraft-attached camera motion.
- Retained upstream removal of the second flight band; rejected wide-angle Taipei/Honolulu clips are not reintroduced. The hero preserves the complete optical frame with no crop.
- The owner?s request for a verified narrower-FOV recording flown like an FPV pilot remains outstanding. This layout/media reuse does not claim that acceptance is complete.
- Compact desktop copy/media layout and mobile heading/media/download order replace the oversized introduction. Native playback controls and an explicit play/pause button keep motion user-controlled, including reduced-motion visits.
- Download and release text now refers to v0.44.1 (`v0.44.1-alpha.1`); media is not represented as a new-release capture. Release validation reported by the release owner: 25 native tests, 218 launcher tests, 4,453 archive files checked, and an actual v0.44 upgrade/first-launch guide check.
- Removed six setup/menu screenshots and the older four-still flight gallery.
- Motor image: recovered from Mac `/Users/noahschultz/ceradon/asset-staging/images/bench-stator-macro-1600.webp`. Blender geometry, not generative imagery or a photograph. Generic, unbranded motor, explicitly captioned as such.
- Reproduction sources are in `kestrel-motor/`; `bl_bench.py` uses `bl_common.py` and `parts.json`. Original Blender 5.2 Cycles staging job completed October 12.
- Kept download, trial contact, release signup, flight-report links, and alpha limitations.
- This does not finish the separate stopped beauty-capture job or backup Alien12's footage.
