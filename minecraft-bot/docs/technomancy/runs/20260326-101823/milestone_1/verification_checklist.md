# Verification Checklist

- [x] parser supports `set home`, `set chest`, `go home`, `where is home`, `where is chest`, `deposit wood`, `deposit all`, and `wood run <n>`
- [x] runtime stores home and chest memory in-process
- [x] remembered deposit fails clearly when chest memory is missing
- [x] composed `wood run` uses lower-level capability contracts and returns task manager to idle
- [x] `npm test` passes
- [ ] live Prism/LAN verification of `set home`, `set chest`, `deposit wood`, and `wood run 16`
