"""
aggregate.py — Cross-match heatmap aggregator
Reads all per-match JSON files and produces 3 compact aggregate files:
  public/data/aggregate_AmbroseValley.json
  public/data/aggregate_GrandRift.json
  public/data/aggregate_Lockdown.json

Each file format:
{
  "map_id": "AmbroseValley",
  "total_matches": 123,
  "categories": {
    "position": [[px, py], ...],   // every 8th point
    "kills":    [[px, py], ...],
    "deaths":   [[px, py], ...],
    "loot":     [[px, py], ...]
  }
}
"""
import json, os, sys

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'data')
MATCHES_FILE = os.path.join(DATA_DIR, 'matches.json')

POSITION_EVENTS = {'Position', 'BotPosition'}
KILL_EVENTS     = {'Kill', 'BotKill'}
DEATH_EVENTS    = {'Killed', 'BotKilled', 'KilledByStorm'}
LOOT_EVENTS     = {'Loot'}

POSITION_STRIDE = 8   # keep every Nth position point to reduce file size

def main():
    with open(MATCHES_FILE) as f:
        matches = json.load(f)

    # Group by map
    by_map = {}
    for m in matches:
        mid = m['map_id']
        if mid not in by_map:
            by_map[mid] = []
        by_map[mid].append(m['match_id'])

    for map_id, match_ids in by_map.items():
        agg = {
            'map_id': map_id,
            'total_matches': len(match_ids),
            'categories': {
                'position': [],
                'kills':    [],
                'deaths':   [],
                'loot':     [],
            }
        }

        pos_counter = 0

        for match_id in match_ids:
            match_file = os.path.join(DATA_DIR, f'{match_id}.json')
            if not os.path.exists(match_file):
                continue
            with open(match_file) as f:
                data = json.load(f)

            for player in data.get('players', []):
                for ev in player.get('events', []):
                    etype = ev.get('event', '')
                    px = ev.get('px')
                    py = ev.get('py')
                    if px is None or py is None:
                        continue

                    if etype in POSITION_EVENTS:
                        if pos_counter % POSITION_STRIDE == 0:
                            agg['categories']['position'].append([round(px, 2), round(py, 2)])
                        pos_counter += 1
                    elif etype in KILL_EVENTS:
                        agg['categories']['kills'].append([round(px, 2), round(py, 2)])
                    elif etype in DEATH_EVENTS:
                        agg['categories']['deaths'].append([round(px, 2), round(py, 2)])
                    elif etype in LOOT_EVENTS:
                        agg['categories']['loot'].append([round(px, 2), round(py, 2)])

        out_path = os.path.join(DATA_DIR, f'aggregate_{map_id}.json')
        with open(out_path, 'w') as f:
            json.dump(agg, f, separators=(',', ':'))

        counts = {k: len(v) for k, v in agg['categories'].items()}
        print(f"  {map_id}: {len(match_ids)} matches → {counts}")

    print("Done.")

if __name__ == '__main__':
    print("Aggregating cross-match heatmap data...")
    main()
