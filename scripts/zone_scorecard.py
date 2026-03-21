"""
zone_scorecard.py — Zone Balance Scorecard preprocessor
Divides each map into a 6×6 grid. For each cell, computes across ALL matches:
  visit_pct   : % of player-matches with at least one position event in cell
  kd_ratio    : kills / (deaths + 0.01) in cell
  avg_loot    : loot events per player-match in cell
  danger      : red (kd>1.5) | yellow (0.6-1.5) | green (<0.6) | grey (inactive)

Outputs: public/data/zone_scorecard_<MapId>.json  (3 files)
"""
import json, os, math

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'data')
MATCHES_FILE = os.path.join(DATA_DIR, 'matches.json')

MAP_SIZES = {
    'AmbroseValley': (4320, 4320),
    'GrandRift':     (2160, 2158),
    'Lockdown':      (9000, 9000),
}
GRID = 6

POSITION_EVENTS = {'Position', 'BotPosition'}
KILL_EVENTS     = {'Kill', 'BotKill'}
DEATH_EVENTS    = {'Killed', 'BotKilled', 'KilledByStorm'}
LOOT_EVENTS     = {'Loot'}

def col_label(c): return str(c + 1)
def row_label(r): return chr(ord('A') + r)

def main():
    with open(MATCHES_FILE) as f:
        matches = json.load(f)

    by_map = {}
    for m in matches:
        by_map.setdefault(m['map_id'], []).append(m['match_id'])

    for map_id, match_ids in by_map.items():
        imgW, imgH = MAP_SIZES.get(map_id, (4320, 4320))

        # Per-cell accumulators
        visits    = [[set() for _ in range(GRID)] for _ in range(GRID)]  # set of (match,player) tuples
        kills     = [[0]*GRID for _ in range(GRID)]
        deaths    = [[0]*GRID for _ in range(GRID)]
        loot      = [[0]*GRID for _ in range(GRID)]
        total_pm  = 0  # total player-match count

        for match_id in match_ids:
            mfile = os.path.join(DATA_DIR, f'{match_id}.json')
            if not os.path.exists(mfile):
                continue
            with open(mfile) as f:
                data = json.load(f)

            for player in data.get('players', []):
                total_pm += 1
                uid = player['user_id']
                for ev in player.get('events', []):
                    px = ev.get('px')
                    py = ev.get('py')
                    if px is None or py is None:
                        continue
                    gx = min(int(px / imgW * GRID), GRID - 1)
                    gy = min(int(py / imgH * GRID), GRID - 1)
                    etype = ev.get('event', '')
                    if etype in POSITION_EVENTS:
                        visits[gy][gx].add((match_id, uid))
                    elif etype in KILL_EVENTS:
                        kills[gy][gx] += 1
                    elif etype in DEATH_EVENTS:
                        deaths[gy][gx] += 1
                    elif etype in LOOT_EVENTS:
                        loot[gy][gx] += 1

        # Build zone list
        zones = []
        for r in range(GRID):
            for c in range(GRID):
                v = len(visits[r][c])
                visit_pct = round((v / max(total_pm, 1)) * 100, 2)
                if visit_pct < 0.5:
                    continue  # inactive — skip
                k = kills[r][c]
                d = deaths[r][c]
                lo = loot[r][c]
                kd_ratio = round(k / (d + 0.01), 2)
                avg_loot  = round(lo / max(total_pm, 1), 3)

                if visit_pct < 1.0:
                    danger = 'grey'
                elif kd_ratio > 1.5:
                    danger = 'red'
                elif kd_ratio >= 0.6:
                    danger = 'yellow'
                else:
                    danger = 'green'

                zones.append({
                    'id':         row_label(r) + col_label(c),
                    'row':        r,
                    'col':        c,
                    'visit_pct':  visit_pct,
                    'kd_ratio':   kd_ratio,
                    'avg_loot':   avg_loot,
                    'danger':     danger,
                    'visits':     v,
                    'kills':      k,
                    'deaths':     d,
                    'loot':       lo,
                })

        zones.sort(key=lambda z: -z['visit_pct'])

        out = {
            'map_id':              map_id,
            'grid':                GRID,
            'imgW':                imgW,
            'imgH':                imgH,
            'total_player_matches': total_pm,
            'zones':               zones,
        }
        out_path = os.path.join(DATA_DIR, f'zone_scorecard_{map_id}.json')
        with open(out_path, 'w') as f:
            json.dump(out, f, separators=(',', ':'))

        print(f'  {map_id}: {len(zones)} active zones, {total_pm} player-matches')

    print('Done.')

if __name__ == '__main__':
    print('Computing Zone Balance Scorecards...')
    main()
