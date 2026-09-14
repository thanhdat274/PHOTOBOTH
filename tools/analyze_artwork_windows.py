"""Locate the four large, light photo wells in opaque 4-cut artwork."""

from collections import deque
from pathlib import Path
import sys

from PIL import Image


def find_windows(path: Path):
    image = Image.open(path).convert("RGB")
    scale = 4
    small = image.resize((image.width // scale, image.height // scale), Image.Resampling.BILINEAR)
    width, height = small.size
    pixels = small.load()
    seen = set()
    components = []

    def is_well(x, y):
        red, green, blue = pixels[x, y]
        return min(red, green, blue) >= 172 and max(red, green, blue) - min(red, green, blue) <= 55

    for y in range(height):
        for x in range(width):
            if (x, y) in seen or not is_well(x, y):
                continue
            queue = deque([(x, y)])
            seen.add((x, y))
            min_x = max_x = x
            min_y = max_y = y
            count = 0
            while queue:
                current_x, current_y = queue.popleft()
                count += 1
                min_x = min(min_x, current_x)
                max_x = max(max_x, current_x)
                min_y = min(min_y, current_y)
                max_y = max(max_y, current_y)
                for next_x, next_y in ((current_x - 1, current_y), (current_x + 1, current_y), (current_x, current_y - 1), (current_x, current_y + 1)):
                    if 0 <= next_x < width and 0 <= next_y < height and (next_x, next_y) not in seen and is_well(next_x, next_y):
                        seen.add((next_x, next_y))
                        queue.append((next_x, next_y))
            box_width = (max_x - min_x + 1) * scale
            box_height = (max_y - min_y + 1) * scale
            if (
                count * scale * scale > image.width * image.height * 0.04
                and image.width * 0.45 < box_width < image.width * 0.95
                and image.height * 0.10 < box_height < image.height * 0.30
            ):
                components.append((min_x * scale, min_y * scale, box_width, box_height))

    return image.size, sorted(components, key=lambda box: box[1])[:4]


if __name__ == "__main__":
    for argument in sys.argv[1:]:
        asset = Path(argument)
        size, windows = find_windows(asset)
        print(f"{asset.as_posix()} size={size} windows={windows}")
