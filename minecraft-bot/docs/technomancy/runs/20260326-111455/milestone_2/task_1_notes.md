# Task 1 Notes

- Implemented `cobble_run` as a composed workflow instead of extending chat handlers directly.
- Kept stone deposit behavior inside the existing `deposit` capability by adding `mode: 'stone'` messaging only.
- Added `stone_tools` as an additive upgrade command that crafts only missing stone tools.
