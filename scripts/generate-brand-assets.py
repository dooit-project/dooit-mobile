#!/usr/bin/env python3
"""Generate platform icon assets from the selected Dooit brand mark."""

from pathlib import Path

from PIL import Image, ImageChops


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/images/dooit-minimal-icon-v3.png"
OUTPUT = ROOT / "assets/images"
PRIMARY = (82, 104, 121, 255)


def trimmed_source() -> Image.Image:
    image = Image.open(SOURCE).convert("RGBA")
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if bbox is None:
        raise ValueError(f"Brand source has no visible pixels: {SOURCE}")
    return image.crop(bbox)


def centered_canvas(
    source: Image.Image,
    canvas_size: tuple[int, int],
    mark_size: tuple[int, int],
    background: tuple[int, int, int, int] = (0, 0, 0, 0),
) -> Image.Image:
    canvas = Image.new("RGBA", canvas_size, background)
    mark = source.copy()
    mark.thumbnail(mark_size, Image.Resampling.LANCZOS)
    position = ((canvas.width - mark.width) // 2, (canvas.height - mark.height) // 2)
    canvas.alpha_composite(mark, position)
    return canvas


def monochrome_check(source: Image.Image) -> Image.Image:
    rgba = source.convert("RGBA")
    red, green, blue, alpha = rgba.split()
    brightness = ImageChops.add(
        ImageChops.add(red.point(lambda value: value * 77 // 256), green.point(lambda value: value * 150 // 256)),
        blue.point(lambda value: value * 29 // 256),
    )
    dark = brightness.point(lambda value: 255 if value < 150 else 0)
    mask = ImageChops.multiply(dark, alpha)
    check = Image.new("RGBA", rgba.size, (255, 255, 255, 0))
    check.putalpha(mask)
    return check


def save(image: Image.Image, name: str) -> None:
    image.save(OUTPUT / name, optimize=True)


def main() -> None:
    source = trimmed_source()

    save(centered_canvas(source, (1024, 1024), (850, 850), PRIMARY), "icon.png")
    save(centered_canvas(source, (512, 512), (330, 330)), "android-icon-foreground.png")
    save(Image.new("RGBA", (512, 512), PRIMARY), "android-icon-background.png")
    save(
        centered_canvas(monochrome_check(source), (432, 432), (238, 238)),
        "android-icon-monochrome.png",
    )
    save(centered_canvas(source, (48, 48), (44, 44)), "favicon.png")
    save(centered_canvas(source, (228, 213), (172, 172)), "splash-icon.png")


if __name__ == "__main__":
    main()
