# JSave Instagram

Account: [@j._save](https://www.instagram.com/j._save/)

## Published

- 2026-09-24: [Launch carousel](https://www.instagram.com/p/Ddqej-QCcyS/) — five slides introducing JSave, quick entry, budget view, and iPhone screenshot import.

## Assets

- `jsave-instagram-avatar.png`: 1080 × 1080 profile image.
- `launch-01.jpg` through `launch-05.jpg`: 1080 × 1350 carousel images uploaded to Instagram.
- `launch-carousel.html`: editable slide source.
- `render-carousel.mjs`: regenerates the JPEG slides from the HTML source.
- `make-avatar.mjs`: regenerates the profile image from the JSave icon.

Run `node marketing/instagram/render-carousel.mjs` from the repository root to refresh the carousel assets. Instagram displayed the PNG screenshots as black after upload, so publish the JPEG exports.
