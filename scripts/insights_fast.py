import json, os
from collections import defaultdict, Counter
import statistics

DATA_PATH = "/sessions/laughing-amazing-tesla/mnt/LILA Assignment/lila-player-journey/public/data/"

# Load matches index
with open(os.path.join(DATA_PATH, "matches.json")) as f:
    matches = json.load(f)

print(f"Total matches: {len(matches)}\n")

# Quick summary stats
map_counts = Counter(m["map_id"] for m in matches)
print("=== MAP DISTRIBUTION ===")
total = len(matches)
for map_id, count in map_counts.most_common():
    print(f"  {map_id}: {count} ({100*count/total:.1f}%)")

# Match composition
human_only = sum(1 for m in matches if m["bot_count"] == 0)
bot_only = sum(1 for m in matches if m["human_count"] == 0)
mixed = sum(1 for m in matches if m["human_count"] > 0 and m["bot_count"] > 0)
print(f"\n=== MATCH COMPOSITION ===")
print(f"  Human-only: {human_only}")
print(f"  Bot-only: {bot_only}")
print(f"  Mixed: {mixed}")

# Bot ratio by date
date_counts = Counter(m["date"] for m in matches)
print(f"\n=== BOT RATIO BY DATE ===")
for date in sorted(date_counts.keys()):
    day_matches = [m for m in matches if m["date"] == date]
    total_players = sum(m["player_count"] for m in day_matches)
    total_bots = sum(m["bot_count"] for m in day_matches)
    if total_players > 0:
        bot_pct = 100*total_bots/total_players
        print(f"  {date}: {bot_pct:.1f}% ({total_bots}/{total_players})")

# Sample 50 matches for event analysis
import random
random.seed(42)
sampled = random.sample(matches, min(50, len(matches)))

event_counts = Counter()
storm_deaths = 0
pvp_kills = 0
bot_kills = 0
loot_positions = defaultdict(list)
death_positions = defaultdict(list)

for i, m in enumerate(sampled):
    match_file = os.path.join(DATA_PATH, f"{m['match_id']}.json")
    if not os.path.exists(match_file):
        continue
    try:
        with open(match_file) as f:
            data = json.load(f)
        map_id = data.get("map_id", "Unknown")
        for player in data.get("players", []):
            if player.get("is_bot"):
                continue
            for ev in player.get("events", []):
                event = ev.get("event", "Unknown")
                event_counts[event] += 1
                px, py = ev.get("px", 0), ev.get("py", 0)
                
                if event == "Loot":
                    loot_positions[map_id].append((px, py))
                elif event == "KilledByStorm":
                    storm_deaths += 1
                    death_positions[map_id].append((px, py))
                elif event == "Killed":
                    death_positions[map_id].append((px, py))
                elif event == "Kill":
                    pvp_kills += 1
                elif event == "BotKill":
                    bot_kills += 1
    except Exception as e:
        print(f"  Error loading {m['match_id']}: {e}")

print(f"\n=== EVENT BREAKDOWN (50-match sample) ===")
total_events = sum(event_counts.values())
if total_events > 0:
    for ev, count in event_counts.most_common(10):
        pct = 100*count/total_events
        print(f"  {ev}: {count} ({pct:.1f}%)")

print(f"\nStorm deaths: {storm_deaths}")
print(f"PvP kills: {pvp_kills}")
print(f"Bot kills: {bot_kills}")
if bot_kills > 0:
    ratio = pvp_kills / bot_kills
    print(f"PvP/BotKill ratio: {ratio:.2f}x")

# Death/kill ratio
total_deaths = storm_deaths + sum(1 for ev, c in event_counts.items() if ev == "Killed" for _ in range(c))
if total_deaths > 0:
    pct_storm = 100 * storm_deaths / total_deaths
    print(f"Storm deaths as % of total deaths: {pct_storm:.1f}%")

# Loot hotspot analysis
print(f"\n=== LOOT DISTRIBUTION (AmbroseValley) ===")
av_loot = loot_positions.get("AmbroseValley", [])
if av_loot:
    mid_x = 4320/2
    mid_y = 4320/2
    quadrants = Counter()
    for px, py in av_loot:
        q = ("N" if py < mid_y else "S") + ("W" if px < mid_x else "E")
        quadrants[q] += 1
    for q, count in quadrants.most_common():
        print(f"  {q}: {count} ({100*count/len(av_loot):.1f}%)")

print("\n=== DEATH DISTRIBUTION (AmbroseValley) ===")
av_deaths = death_positions.get("AmbroseValley", [])
if av_deaths:
    mid_x = 4320/2
    mid_y = 4320/2
    quadrants = Counter()
    for px, py in av_deaths:
        q = ("N" if py < mid_y else "S") + ("W" if px < mid_x else "E")
        quadrants[q] += 1
    for q, count in quadrants.most_common():
        print(f"  {q}: {count} ({100*count/len(av_deaths):.1f}%)")
