"""
flow_vectors.py — Movement flow vector preprocessor
For each map, computes dominant movement direction per 20×20 grid cell.
Uses consecutive Position/BotPosition event pairs to determine flow.

Outputs: public/data/flow_vectors_<MapId>.json  (3 files)
"""
import json, os, math

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'data')
MATCHES_FILE = os.path.join(DATA_DIR, 'matches.json')

MAP_SIZES = {
    'AmbroseValley': (4320, 4320),
    'GrandRift':     (2160, 2158),
    'Lockdown':      (9000, 9000),
}
GRID = 20
MIN_COUNT = 5   # filter sparse cells

POSITION_EVENTS = {'Position', 'BotPosition'}

def main():
    with open(MATCHES_FILE) as f:
        matches = json.load(f)

    by_map = {}
    for m in matches:
        by_map.setdefault(m['map_id'], []).append(m['match_id'])

    for map_id, match_ids in by_map.items():
        imgW, imgH = MAP_SIZES.get(map_id, (4320, 4320))

        # sum_dx, sum_dy, count per cell
        cells = [[ {'sum_dx': 0.0, 'sum_dy': 0.0, 'count': 0}
                   for _ in range(GRID)] for _ in range(GRID)]

        for match_id in match_ids:
            mfile = os.path.join(DATA_DIR, f'{match_id}.json')
            if not os.path.exists(mfile):
                continue
            with open(mfile) as f:
                data = json.load(f)

            for player in data.get('players', []):
                pos_events = [e for e in player.get('events', []) if e.get('event') in POSITION_EVENTS]
                for i in range(len(pos_events) - 1):
                    e1 = pos_events[i]
                    e2 = pos_events[i + 1]
                    dx = e2['px'] - e1['px']
                    dy = e2['py'] - e1['py']
                    dist = math.hypot(dx, dy)
                    if dist < 1.0:
                        continue  # skip stationary pairs
                    # normalize to unit vector
                    udx, udy = dx / dist, dy / dist
                    # assign to grid cell of start point
                    gx = min(int(e1['px'] / imgW * GRID), GRID - 1)
                    gy = min(int(e1['py'] / imgH * GRID), GRID - 1)
                    cells[gy][gx]['sum_dx'] += udx
                    cells[gy][gx]['sum_dy'] += udy
                    cells[gy][gx]['count']  += 1

        # Build output list, compute log-scaled magnitude
        max_count = max(
            (cells[r][c]['count'] for r in range(GRID) for c in range(GRID) if cells[r][c]['count'] >= MIN_COUNT),
            default=1
        )
        log_max = math.log(max_count + 1)

        out_cells = []
        for r in range(GRID):
            for c in range(GRID):
                cell = cells[r][c]
                if cell['count'] < MIN_COUNT:
                    continue
                avg_dx = cell['sum_dx'] / cell['count']
                avg_dy = cell['sum_dy'] / cell['count']
                length = math.hypot(avg_dx, avg_dy)
                if length < 0.001:
                    continue
                # normalize averaged vector
                ndx = avg_dx / length
                ndy = avg_dy / length
                # log-scaled magnitude 0–10
                mag = round((math.log(cell['count'] + 1) / log_max) * 10, 2)
                out_cells.append({'row': r, 'col': c, 'dx': round(ndx, 3), 'dy': round(ndy, 3), 'mag': mag})

        out = {
            'map_id': map_id,
            'grid':   GRID,
            'imgW':   imgW,
            'imgH':   imgH,
            'cells':  out_cells,
        }
        out_path = os.path.join(DATA_DIR, f'flow_vectors_{map_id}.json')
        with open(out_path, 'w') as f:
            json.dump(out, f, separators=(',', ':'))

        print(f'  {map_id}: {len(out_cells)} cells with flow vectors')

    print('Done.')

if __name__ == '__main__':
    print('Computing movement flow vectors...')
    main()
