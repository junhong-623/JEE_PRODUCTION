# Screenshot import Reel

Vertical Instagram Reel explaining the unified iPhone shortcut. Use a real, redacted screen recording for the middle section. Do not show names, account numbers, transaction references, the import key, or a live private ledger.

## Storyboard (about 20 seconds)

| Time | Visual | On-screen message |
| --- | --- | --- |
| 0–2s | Brand hook | 付款截图，怎样进入 JSave？ |
| 2–5s | Single TNG or CIMB transaction screenshot | 一张单笔交易截图 |
| 5–8s | Photos share sheet; choose JSave Receipt Import | 分享给统一快捷指令 |
| 8–12s | Category menu | 选择类别 |
| 12–16s | Review amount, date, account and note; confirm | 核对后才保存 |
| 16–18s | Saved confirmation | 已加入 JSave ✓ |
| 18–21s | Brand end card | 免费使用 · 教程在 JSave 简介页 |

The shortcut extracts text on iPhone. It sends the extracted text to JSave for parsing; the screenshot itself stays on the phone. Only supported TNG and CIMB single-transaction screenshots should be shown. Avoid implying that all banking screenshots or entire statements work.

`reel-cards.html` contains editable opening and closing graphics; `render-cards.mjs` exports vertical JPEG frames. The final MP4 will be assembled after receiving the demonstration recording.
