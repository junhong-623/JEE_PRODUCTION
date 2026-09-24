# JSave × CIMB iPhone 快捷指令

这个快捷指令读取 CIMB「Transaction Details」截图中的文字，先预览，再由使用者选择类别及确认，最后才加入 JSave。截图留在 iPhone；接口只收到 iPhone 提取的文字。它与现有 TNG 指令及密钥分开。

## 设置与安装

1. 在 JSave「设置 → 账户」建立或确认一个 CIMB 银行账户（类型为银行）、一个 CIMB 信用卡账户（类型为信用卡），以及自己的 TNG 钱包账户（类型为电子钱包）。只使用其中一种 CIMB 账户时，另一项可以留空。
2. 打开「设置 → CIMB 交易截图快捷指令」，将实际账户分别选好。若要导入 TNG 充值截图，须设置自己的 TNG 钱包。
3. 生成并复制 **CIMB 密钥**。它只显示一次。重新生成只会使旧 CIMB 密钥失效，不影响 TNG 指令。
4. 下载已签名的 [`JSave-CIMB-Import.shortcut`](../public-jsave/shortcuts/JSave-CIMB-Import.shortcut)，在 iPhone 的「文件」App 打开。导入时粘贴 CIMB 密钥；如果没有出现导入提问，就编辑 `JSave CIMB Import`，将密钥填入第一个「文本」操作。
5. 从「照片」分享一张 CIMB 交易详情截图给 `JSave CIMB Import`。检查金额、日期、说明、账户及类别后，才确认保存。

签名文件 SHA-256：`D2FAB84A645C401B64ECC3472075CAE4269DA1555C89A5AC4B47B9B28A61170B`。

## 已覆盖的交易页

- 信用卡消费：读取金额、`Transacted Date`、`To`、`Transfer Type Credit Card`，使用交易日期，不使用稍后的 `Posted Date`。
- 银行入账：读取金额、`Date`、`Details`，要求文字中有明确的入账标志，例如 `CR`，由使用者选择收入类别。
- 银行扣款：读取负号或 `POS DEBIT` 等扣款标志，由使用者选择支出类别。
- 银行向自己 TNG 钱包充值：识别 `TNG EWALLET` 与 `TOPUP`，并按 CIMB 银行 → TNG 钱包的账户间转账处理。没有设置 TNG 钱包时拒绝导入。

没有足够资料确定金额、日期、交易方向或说明时，指令会拒绝保存。非 CIMB 交易详情截图会直接结束。相同截图再次导入会返回「已导入过」。

## 限制

- CIMB 交易详情截图没有稳定的交易编号。本版按账户种类、方向、日期、金额和说明生成去重标识；同一天同金额且说明相同的两笔交易可能被视为重复。导入前请核对。
- 该指令每次只处理一张截图，不导入整份 PDF statement。账单批量导入需要另一套流程。
- 如果同时导入 CIMB 的 TNG 充值截图与 TNG 钱包内对应的入账截图，请核对 JSave 记录，避免把同一笔资金移动再记为收入。
- 需在 iPhone 实机验证安装、OCR 和删除照片操作。删除照片只会在保存或检测到重复后询问，并使用本次指令接收的照片。
