import json, os
from collections import defaultdict, Counter
import statistics

DATA_PATH = "/sessions/laughing-amazing-tesla/mnt/LILA Assignment/lila-player-journey/public/data/"

# Load matches index
with open(os.path.join(DATA_PATH, "matches.json")) as f:
    matches = json.load(f)

print(f"Total matches: {len(matches)}")

# Map distribution
map_counts = Counter(m["map_id"] for m in matches)
print("\n=== MAP DISTRIBUTION ===")
total = len(matches)
for map_id, count in map_counts.most_common():
    print(f"  {map_id}: {count} matches ({100*count/total:.1f}%)")

# Date distribution
date_counts = Counter(m["date"] for m in matches)
print("\n=== DATE DISTRIBUTION ===")
for date, count in sorted(date_counts.items()):
    print(f"  {date}: {count} matches")

# Match size distribution
sizes = [m["player_count"] for m in matches]
print(f"\n=== MATCH SIZE ===")
print(f"  avg players/match: {statistics.mean(sizes):.1f}")
print(f"  median: {statistics.median(sizes)}")
print(f"  solo matches (1 player): {sum(1 for s in sizes if s == 1)}")
print(f"  large matches (>5 players): {sum(1 for s in sizes if s > 5)}")

# Event analysis — sample 100 matches for speed
import random
random.seed(42)
sampled = random.sample(matches, min(100, len(matches)))

event_counts = Counter()
map_event_counts = defaultdict(Counter)
loot_positions = defaultdict(list)
kill_positions = defaultdict(list)
death_positions = defaultdict(list)
storm_deaths = 0
pvp_kills = 0
bot_kills = 0
human_player_paths = defaultdict(list)

for m in sampled:
    match_file = os.path.join(DATA_PATH, f"{m['match_id']}.json")
    if not os.path.exists(match_file):
        continue
    with open(match_file) as f:
        data = json.load(f)
    
    map_id = data["map_id"]
    for player in data["players"]:
        if player["is_bot"]:
            continue  # focus on humans for most metrics
        for ev in player["events"]:
            event_counts[ev["event"]] += 1
            map_event_counts[map_id][ev["event"]] += 1
            
            if ev["event"] == "Loot":
                loot_positions[map_id].append((ev["px"], ev["py"]))
            elif ev["event"] in ("Kill", "BotKill"):
                kill_positions[map_id].append((ev["px"], ev["py"]))
            elif ev["event"] in ("Killed", "BotKilled", "KilledByStorm"):
                death_positions[map_id].append((ev["px"], ev["py"]))
            
            if ev["event"] == "KilledByStorm":
                storm_deaths += 1
            elif ev["event"] in ("Kill", "Killed"):
                pvp_kills += 1
            elif ev["event"] == "BotKill":
                bot_kills += 1

print("\n=== EVENT BREAKDOWN (human players, 100-match sample) ===")
total_events = sum(event_counts.values())
for ev, count in event_counts.most_common():
    print(f"  {ev}: {count} ({100*count/total_events:.1f}%)")

print(f"\nStorm deaths: {storm_deaths}")
print(f"PvP kills (Kill+Killed): {pvp_kills}")
print(f"Bot kills: {bot_kills}")
print(f"PvP/BotKill ratio: {pvp_kills/(bot_kills+1):.3f}")

# Human vs Bot match composition
human_only = sum(1 for m in matches if m["bot_count"] == 0)
bot_only = sum(1 for m in matches if m["human_count"] == 0)
mixed = sum(1 for m in matches if m["human_count"] > 0 and m["bot_count"] > 0)
print(f"\n=== MATCH COMPOSITION ===")
print(f"  Human-only matches: {human_only}")
print(f"  Bot-only matches: {bot_only}")
print(f"  Mixed matches: {mixed}")

# Bot ratio by date
print("\n=== BOT RATIO BY DATE ===")
for date in sorted(date_counts.keys()):
    day_matches = [m for m in matches if m["date"] == date]
    total_players = sum(m["player_count"] for m in day_matches)
    total_bots = sum(m["bot_count"] for m in day_matches)
    if total_players > 0:
        print(f"  {date}: {100*total_bots/total_players:.1f}% bots ({total_bots}/{total_players})")

# Loot spatial clustering (find hotspot quadrant)
print("\n=== LOOT HOTSPOTS (AmbroseValley) ===")
av_loot = loot_positions.get("AmbroseValley", [])
if av_loot:
    mid_x = 4320/2
    mid_y = 4320/2
    quadrants = Counter()
    for px, py in av_loot:
        q = ("N" if py < mid_y else "S") + ("W" if px < mid_x else "E")
        quadrants[q] += 1
    for q, count in quadrants.most_common():
        print(f"  {q}: {count} loot events ({100*count/len(av_loot):.1f}%)")

print("\n=== DEATHS BY ZONE (AmbroseValley) ===")
av_deaths = death_positions.get("AmbroseValley", [])
if av_deaths:
    mid_x = 4320/2
    mid_y = 4320/2
    quadrants = Counter()
    for px, py in av_deaths:
        q = ("N" if py < mid_y else "S") + ("W" if px < mid_x else "E")
        quadrants[q] += 1
    for q, count in quadrants.most_common():
        print(f"  {q}: {count} deaths ({100*count/len(av_deaths):.1f}%)")
