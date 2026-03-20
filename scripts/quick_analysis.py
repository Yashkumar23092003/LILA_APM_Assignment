#!/usr/bin/env python
import json
import os
from collections import Counter

data_path = "/sessions/laughing-amazing-tesla/mnt/LILA Assignment/lila-player-journey/public/data/"

# First, just load and count matches.json
try:
    with open(os.path.join(data_path, "matches.json"), 'r') as f:
        content = f.read()
        matches = json.loads(content)
    print(f"Loaded {len(matches)} matches successfully")
    
    # Quick stats
    maps = Counter(m.get("map_id") for m in matches)
    print(f"\nMap distribution: {dict(maps)}")
    
    # Sample first 5 files
    print("\n=== Sample file analysis ===")
    for i, match in enumerate(matches[:5]):
        match_id = match["match_id"]
        match_file = os.path.join(data_path, f"{match_id}.json")
        print(f"\nMatch {i+1}: {match_id}")
        print(f"  Expected: map={match.get('map_id')}, players={match.get('player_count')}, bots={match.get('bot_count')}")
        
        if os.path.exists(match_file):
            with open(match_file, 'r') as f:
                match_data = json.load(f)
            print(f"  Loaded OK. Players: {len(match_data.get('players', []))}")
            for j, player in enumerate(match_data.get('players', [])[:2]):
                events = player.get('events', [])
                is_bot = player.get('is_bot', False)
                print(f"    Player {j+1}: bot={is_bot}, events={len(events)}")
                if events:
                    event_types = Counter(e.get('event') for e in events)
                    print(f"      Event types: {dict(event_types)}")
        else:
            print(f"  ERROR: File not found")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
