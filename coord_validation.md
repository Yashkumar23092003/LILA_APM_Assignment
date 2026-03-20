# Coordinate Validation Report

## Formula

```
u  = (x - origin_x) / scale
v  = (z - origin_z) / scale
px = u * img_w
py = (1 - v) * img_h      ← Y-axis FLIPPED (image origin is top-left)
```

- `x` and `z` are world coordinates. `y` is elevation — ignored for 2D rendering.
- Y-axis is flipped because game world Z increases upward, but image pixel Y increases downward.

---

## Map Configurations (Actual Image Dimensions)

> ⚠️ Original brief stated 1024×1024 for all maps. Actual measured dimensions differ — use these values.

| Map | Scale | Origin X | Origin Z | img_w | img_h |
|---|---|---|---|---|---|
| AmbroseValley | 900 | -370 | -473 | 4320 | 4320 |
| GrandRift | 581 | -290 | -290 | 2160 | 2158 |
| Lockdown | 1000 | -500 | -500 | 9000 | 9000 |

---

## Sample Point Assertions — 15/15 PASSED ✅

Real data points sampled from parquet files, transformed, and checked against `[0, img_dim]`.

| Map | x | z | px | py | In Bounds |
|---|---|---|---|---|---|
| AmbroseValley | -315.35 | -2.59 | 262.3 | 2062.0 | ✅ |
| AmbroseValley | -317.80 | 0.66 | 250.5 | 2046.4 | ✅ |
| AmbroseValley | -301.99 | 19.38 | 326.4 | 1956.6 | ✅ |
| AmbroseValley | -290.47 | 35.83 | 381.7 | 1877.6 | ✅ |
| AmbroseValley | -283.83 | 52.37 | 413.6 | 1798.2 | ✅ |
| GrandRift | -223.19 | 42.54 | 248.4 | 922.8 | ✅ |
| GrandRift | -201.28 | 41.21 | 329.8 | 927.8 | ✅ |
| GrandRift | -188.56 | 38.23 | 377.1 | 938.9 | ✅ |
| GrandRift | -192.82 | 26.78 | 361.3 | 981.4 | ✅ |
| GrandRift | -185.09 | 31.18 | 390.0 | 965.1 | ✅ |
| Lockdown | -346.56 | 132.78 | 1380.9 | 3305.0 | ✅ |
| Lockdown | -340.58 | 121.59 | 1434.8 | 3405.7 | ✅ |
| Lockdown | -331.00 | 105.15 | 1521.0 | 3553.6 | ✅ |
| Lockdown | -304.14 | 99.31 | 1762.7 | 3606.2 | ✅ |
| Lockdown | -290.04 | 91.02 | 1889.6 | 3680.9 | ✅ |

---

## Edge Case Corner Tests — 12/12 PASSED ✅

All four corners of observed coordinate ranges tested per map.

| Map | Corner (x, z) | px | py | In Bounds |
|---|---|---|---|---|
| AmbroseValley | (-321, -369) | 235.2 | 3820.8 | ✅ |
| AmbroseValley | (302, -369) | 3225.6 | 3820.8 | ✅ |
| AmbroseValley | (-321, 335) | 235.2 | 441.6 | ✅ |
| AmbroseValley | (302, 335) | 3225.6 | 441.6 | ✅ |
| GrandRift | (-224, -188) | 245.4 | 1779.1 | ✅ |
| GrandRift | (257, -188) | 2033.6 | 1779.1 | ✅ |
| GrandRift | (-224, 170) | 245.4 | 449.4 | ✅ |
| GrandRift | (257, 170) | 2033.6 | 449.4 | ✅ |
| Lockdown | (-356, -260) | 1296.0 | 6840.0 | ✅ |
| Lockdown | (276, -260) | 6984.0 | 6840.0 | ✅ |
| Lockdown | (-356, 249) | 1296.0 | 2259.0 | ✅ |
| Lockdown | (276, 249) | 6984.0 | 2259.0 | ✅ |

---

## Y-Axis Flip Verification — 3/3 PASSED ✅

High Z (north in game world) correctly maps to small py (top of image).

| Map | Z=+200 → py | Z=-200 → py | Correct direction |
|---|---|---|---|
| AmbroseValley | 1090 | 3010 | ✅ high-Z → smaller py |
| GrandRift | 338 | 1824 | ✅ high-Z → smaller py |
| Lockdown | 2700 | 6300 | ✅ high-Z → smaller py |

---

## Result

**✅ All 27 checks passed. Formula is correct. Safe to use in production.**

Agent D must use `img_w` and `img_h` per-map (not hardcoded). GrandRift is non-square (2160×2158) — use separate width and height variables.
