# Risk Notes

- Saved chest memory is coordinate-based and therefore fails if the chest is removed, moved, replaced, or blocked.
- `set chest` prefers the looked-at chest and falls back to the nearest reachable chest. This is deterministic, but still depends on the local world layout.
- `wood run` composes lower-level capability logic through reusable `perform` contracts. Future capability refactors must preserve those internal composition hooks.
- Live LAN pathfinding, chest reachability, and block interaction remain higher risk than the automated unit tests can prove in this environment.
