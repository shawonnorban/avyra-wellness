# Original brand artwork

The PNGs and JPEGs that `public/avyra/` shipped before they were re-encoded to
WebP. Kept because WebP is lossy: if one image ever looks wrong, these are the
only way back.

Nothing references them and they sit outside `public/`, so they are never
served — a visitor pays nothing for them.

## Why they were converted

`UploadService` re-encodes every admin upload to WebP. Static files in `public/`
bypass it entirely, so these arrived from the old repo as raw PNGs and shipped
untouched: 9.4 MB, of which one campaign page loaded 3.5 MB. Re-encoded at
quality 82 the same set is 1.3 MB, with no visible difference.

`hero-man.jpg` is worth knowing about — it is a PNG wearing a `.jpg` name, which
is why anything reading it as a JPEG fails on it.

## Adding a new brand image

Do not drop a PNG into `public/avyra/`. Convert it first — GD in the WAMP PHP
build has WebP support:

    C:/wamp64/bin/php/php8.4.15/php.exe -r '
      $i = imagecreatefrompng("art.png");
      imagepalettetotruecolor($i);
      imagealphablending($i, false);
      imagesavealpha($i, true);          // keeps transparent cut-outs clean
      imagewebp($i, "art.webp", 82);
    '

Then put the `.webp` in `public/avyra/` and the original here.
