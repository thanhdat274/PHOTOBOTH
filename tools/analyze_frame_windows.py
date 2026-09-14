"""Report large transparent rectangles used as photo windows in frame assets."""

from collections import deque
from pathlib import Path
import sys

from PIL import Image


LAYOUT_SLOTS = {
    "1": [(80, 150, 740, 740)],
    "2": [(60, 150, 640, 490), (60, 670, 640, 490)],
    "3": [(193, 521, 407, 337), (193, 901, 407, 338), (193, 1283, 407, 338)],
    "4": [(60, 140, 580, 445), (60, 615, 580, 445), (60, 1090, 580, 445), (60, 1565, 580, 445)],
    "4-grid": [(65, 140, 500, 480), (595, 140, 500, 480), (65, 650, 500, 480), (595, 650, 500, 480)],
    "6": [(65, 140, 500, 440), (595, 140, 500, 440), (65, 610, 500, 440), (595, 610, 500, 440), (65, 1080, 500, 440), (595, 1080, 500, 440)],
    "8": [(65, 140, 500, 410), (595, 140, 500, 410), (65, 580, 500, 410), (595, 580, 500, 410), (65, 1020, 500, 410), (595, 1020, 500, 410), (65, 1460, 500, 410), (595, 1460, 500, 410)],
    "9": [(60, 140, 393, 370), (476, 140, 393, 370), (892, 140, 393, 370), (60, 540, 393, 370), (476, 540, 393, 370), (892, 540, 393, 370), (60, 940, 393, 370), (476, 940, 393, 370), (892, 940, 393, 370)],
}


def safe_rectangles(path: Path):
    image = Image.open(path).convert("RGBA")
    alpha = image.getchannel("A")
    layout = path.stem
    slots = LAYOUT_SLOTS.get(layout, [])
    safe = []
    for x, y, width, height in slots:
        # Keep only rows where almost the entire intended photo window is clear.
        clear_rows = []
        for py in range(y, min(y + height, image.height)):
            row = alpha.crop((x, py, min(x + width, image.width), py + 1))
            transparent = sum(value <= 32 for value in row.getdata())
            clear_rows.append(transparent / max(1, row.width) >= 0.985)

        runs = []
        start = None
        for offset, is_clear in enumerate(clear_rows + [False]):
            if is_clear and start is None:
                start = offset
            elif not is_clear and start is not None:
                runs.append((start, offset))
                start = None
        if not runs:
            safe.append((x, y, width, height))
            continue
        top, bottom = max(runs, key=lambda run: run[1] - run[0])
        safe.append((x, y + top, width, bottom - top))
    return image.size, safe


def transparent_components(path: Path):
    image = Image.open(path).convert("RGBA")
    width, height = image.size
    alpha = image.getchannel("A")
    # Work at quarter resolution; generated window edges are axis-aligned.
    scale = max(1, min(width, height) // 350)
    small = alpha.resize((width // scale, height // scale), Image.Resampling.NEAREST)
    sw, sh = small.size
    pixels = small.load()
    seen = set()
    components = []

    for y in range(sh):
        for x in range(sw):
            if pixels[x, y] > 32 or (x, y) in seen:
                continue
            queue = deque([(x, y)])
            seen.add((x, y))
            min_x = max_x = x
            min_y = max_y = y
            count = 0
            while queue:
                cx, cy = queue.popleft()
                count += 1
                min_x, max_x = min(min_x, cx), max(max_x, cx)
                min_y, max_y = min(min_y, cy), max(max_y, cy)
                for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                    if 0 <= nx < sw and 0 <= ny < sh and (nx, ny) not in seen and pixels[nx, ny] <= 32:
                        seen.add((nx, ny))
                        queue.append((nx, ny))
            box_w = (max_x - min_x + 1) * scale
            box_h = (max_y - min_y + 1) * scale
            if count * scale * scale >= width * height * 0.015 and box_w > width * 0.15 and box_h > height * 0.06:
                components.append((min_x * scale, min_y * scale, box_w, box_h))

    return image.size, sorted(components, key=lambda box: (box[1], box[0]))


if __name__ == "__main__":
    for arg in sys.argv[1:]:
        asset = Path(arg)
        if asset.is_dir():
            candidates = sorted(asset.glob("*.png"))
            affected = []
            for candidate in candidates:
                _, safe = safe_rectangles(candidate)
                expected = LAYOUT_SLOTS.get(candidate.stem, [])
                for index, (actual, target) in enumerate(zip(safe, expected), start=1):
                    if actual[3] < target[3] * 0.94:
                        affected.append((candidate.name, index, target, actual))
            print(f"{asset.as_posix()} assets={len(candidates)} obstructed_windows={affected}")
            continue
        size, boxes = transparent_components(asset)
        _, safe = safe_rectangles(asset)
        print(f"{asset.as_posix()} size={size} windows={boxes} safe={safe}")
