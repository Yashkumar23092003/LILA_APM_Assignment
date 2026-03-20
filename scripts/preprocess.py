import pandas as pd
import numpy as np
import os
import json
from pathlib import Path

DATA_PATH = "/sessions/laughing-amazing-tesla/player_data_raw/player_data/"
OUTPUT_PATH = "/sessions/laughing-amazing-tesla/lila-player-journey-git/public/data/"
DAYS = ["February_10","February_11","February_12","February_13","February_14"]

MAP_CONFIG = {
    "AmbroseValley": {"scale": 900,  "origin_x": -370, "origin_z": -473, "img_w": 4320, "img_h": 4320},
    "GrandRift":     {"scale": 581,  "origin_x": -290, "origin_z": -290, "img_w": 2160, "img_h": 2158},
    "Lockdown":      {"scale": 1000, "origin_x": -500, "origin_z": -500, "img_w": 9000, "img_h": 9000},
}

def world_to_pixel(x, z, map_id):
    cfg = MAP_CONFIG[map_id]
    u = (x - cfg["origin_x"]) / cfg["scale"]
    v = (z - cfg["origin_z"]) / cfg["scale"]
    px = u * cfg["img_w"]
    py = (1 - v) * cfg["img_h"]
    return round(float(px), 2), round(float(py), 2)

def decode_event(e):
    if isinstance(e, bytes):
        return e.decode("utf-8")
    return str(e)

os.makedirs(OUTPUT_PATH, exist_ok=True)

match_index = {}

for day in DAYS:
    day_path = os.path.join(DATA_PATH, day)
    if not os.path.exists(day_path):
        continue
    files = [f for f in os.listdir(day_path) if f.endswith(".nakama-0")]
    print(f"{day}: {len(files)} files")

    for fname in files:
        fpath = os.path.join(day_path, fname)
        try:
            df = pd.read_parquet(fpath)
        except Exception as e:
            print(f"  SKIP {fname}: {e}")
            continue

        if df.empty:
            continue

        # Decode event
        df["event"] = df["event"].apply(decode_event)

        # Bot detection
        df["is_bot"] = pd.to_numeric(df["user_id"], errors="coerce").notna()

        # Strip match_id suffix
        df["match_id_clean"] = df["match_id"].str.replace(".nakama-0", "", regex=False)

        # ── FIXED TIMESTAMP NORMALIZATION ──────────────────────────────────
        # datetime64[ms].astype("int64") gives ms since epoch directly.
        # Do NOT divide by 1_000_000 — that collapses all events to the same ms bucket.
        ts_ms = df["ts"].astype("int64")          # already in milliseconds
        df["ts_norm_ms"] = (ts_ms - ts_ms.min()).astype(int)
        # ───────────────────────────────────────────────────────────────────

        # Pixel coords
        map_id = df["map_id"].iloc[0]
        if map_id not in MAP_CONFIG:
            print(f"  SKIP {fname}: unknown map {map_id}")
            continue

        px_list, py_list = [], []
        for _, row in df.iterrows():
            px, py = world_to_pixel(row["x"], row["z"], map_id)
            px_list.append(px)
            py_list.append(py)
        df["px"] = px_list
        df["py"] = py_list

        # Drop true duplicates only (same player, same ms, same event)
        df = df.drop_duplicates(subset=["user_id", "ts_norm_ms", "event"])

        # Build record
        record = {
            "user_id": df["user_id"].iloc[0],
            "match_id": df["match_id_clean"].iloc[0],
            "map_id": map_id,
            "date": day,
            "is_bot": bool(df["is_bot"].iloc[0]),
            "events": df[["ts_norm_ms", "px", "py", "event"]].to_dict("records")
        }

        mid = df["match_id_clean"].iloc[0]
        if mid not in match_index:
            match_index[mid] = {
                "match_id": mid,
                "map_id": map_id,
                "date": day,
                "players": [],
                "human_count": 0,
                "bot_count": 0,
                "total_events": 0
            }

        match_index[mid]["players"].append(record)
        if record["is_bot"]:
            match_index[mid]["bot_count"] += 1
        else:
            match_index[mid]["human_count"] += 1
        match_index[mid]["total_events"] += len(record["events"])

# Write per-match JSON files
match_summary = []
for mid, mdata in match_index.items():
    match_file = os.path.join(OUTPUT_PATH, f"{mid}.json")
    with open(match_file, "w") as f:
        json.dump(mdata, f, separators=(",", ":"))

    match_summary.append({
        "match_id": mid,
        "map_id": mdata["map_id"],
        "date": mdata["date"],
        "human_count": mdata["human_count"],
        "bot_count": mdata["bot_count"],
        "total_events": mdata["total_events"],
        "player_count": mdata["human_count"] + mdata["bot_count"]
    })

# Sort by total_events descending so best matches appear first in selector
match_summary.sort(key=lambda m: m["total_events"], reverse=True)

with open(os.path.join(OUTPUT_PATH, "matches.json"), "w") as f:
    json.dump(match_summary, f, separators=(",", ":"), indent=2)

total_events = sum(m["total_events"] for m in match_summary)
print(f"\nDone. {len(match_index)} matches. {total_events:,} total events.")
print(f"Top 5 matches by events:")
for m in match_summary[:5]:
    print(f"  {m['match_id'][:20]}... {m['map_id']:20s} {m['total_events']} events, {m['player_count']} players")
