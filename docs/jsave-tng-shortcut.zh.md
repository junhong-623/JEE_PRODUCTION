# JSave × TNG iPhone 快捷指令

这份设置说明配合 JSave 的 `jsaveShortcutImport` 函数使用。已签名的快捷指令位于 [`public-jsave/shortcuts/JSave-TNG-Import.shortcut`](../public-jsave/shortcuts/JSave-TNG-Import.shortcut)，Cherri 源码位于 [`shortcuts/JSave-TNG-Import.cherri`](../shortcuts/JSave-TNG-Import.cherri)。快捷指令已编译并检查请求参数，仍须在 iPhone 上验证导入和运行。

## 1. 在 JSave 建立密钥

1. 在 JSave「设置 → 账户」建立或确认一个 TNG 电子钱包账户。
2. 打开「设置 → TNG 截图快捷指令」，选择这个账户，按「生成快捷指令密钥」。
3. 复制 **接口网址** 和 **密钥**。密钥只显示这一次；重新生成会使旧密钥失效。
4. 密钥等同于一个仅可向你的 JSave 账户导入 TNG 交易的密码。不要把含有密钥的快捷指令分享给别人。可随时在同一设置页停用。

## 2. 下载并在 iPhone 导入

1. 打开 JSave「设置 → TNG 截图快捷指令」，点「下载 iPhone 快捷指令」。也可以直接从 [JSave 站点下载](https://jsave.jeeprod.com/shortcuts/JSave-TNG-Import.shortcut)。
2. 在 iPhone 的「文件」App 打开下载的 `JSave-TNG-Import.shortcut`。导入设置会问你要 JSave 密钥，粘贴第 1 节复制的完整密钥。下载文件中没有预置任何用户密钥。
3. 先从「照片」分享一张 TNG 交易详情截图，选择 `JSave TNG Import` 运行。它会提取文字、请求预览、让你选类别并显示核对提醒；按「取消」不会提交。
4. 确认导入成功后，再考虑设置截屏自动化。已打开的 JSave PWA 可能需要联网同步或重新打开，才能看到新交易。

导入文件的 SHA-256：`E4BB79572F64F453279F38C4E6E0C4F3A6BE9C94A888E10F5530493138C6D8A6`。

## 3. 手动建立方式（备用）

先让快捷指令从分享菜单接收**图像**，用一张已保存的 TNG 截图完成测试。随后再添加截屏自动化；这样较容易排查是截图触发还是文字识别的问题。

1. 将快捷指令设为「在共享表单中显示」，输入类型选「图像」。
2. 添加「从图像提取文字」，输入为快捷指令接收的图像。将结果存为变量 `OCR文字`。
3. 添加「获取 URL 内容」：网址填 JSave 设置页给出的接口网址；方法为 `POST`；请求体为 `JSON`，包含 `action` = `preview`、`text` = `OCR文字`。在请求头加入 `Authorization` = `Bearer ` 后接完整密钥（中间有一个空格）。
4. 从返回字典的 `draft` 读取 `type`、`amount`、`currency`、`date`、`time`、`note`。若请求报错，停止快捷指令，不提交交易。
5. 使用「如果」判断 `type`：`expense` 显示支出类别菜单；`income` 显示收入类别菜单。每个菜单选项将对应的代码存到变量 `类别代码`。映射见下表。
6. 使用「显示提醒」展示交易方向、金额、日期、预设备注和已选类别。按取消即停止；只有你确认才继续。
7. 再添加一个「获取 URL 内容」，使用相同接口网址、`POST` 方法和相同的 `Authorization` 请求头。JSON 请求体为 `action` = `commit`、`text` = `OCR文字`、`category` = `类别代码`。
8. 根据返回的 `status` 显示「已加入 JSave」或「这笔交易已导入过」。`status` 为 `created` 或 `duplicate`。

| 支出菜单 | 类别代码 | 收入菜单 | 类别代码 |
| --- | --- | --- | --- |
| 餐饮 | `catFood` | 薪资 | `catSalary` |
| 交通 | `catTransport` | 接案 | `catFreelance` |
| 账单 | `catBills` | 投资 | `catInvestment` |
| 娱乐 | `catEntertainment` | 礼物 | `catGift` |
| 医疗 | `catHealth` | 其他收入 | `catOtherIncome` |
| 购物 | `catShopping` |  |  |
| 其他支出 | `catOther` |  |  |

截图本身不上传；发送到 JSave 的是 iPhone 提取的文字。接口只接受识别为 **TNG 成功交易**、且有金额、交易日期、商家或转账人、交易编号的内容。相同的 TNG 交易编号再次提交会返回 `duplicate`，不会新增第二笔。

## 4. 在 iPhone 添加截屏自动化

如果你的 iOS「快捷指令 → 自动化」有「截屏」触发器，可在截图保存到「照片」时运行「TNG 记账」。截屏触发器适用于**所有 App**，因此快捷指令会先尝试识别 TNG 详情；其他截图会被 JSave 接口拒绝。自动化需要在每台 iPhone 上设置一次。

先确认自动化能取得**刚保存的截图**。若触发器没有直接传入图像，可以用「查找照片」筛选截图相簿、按创建时间降序、限制 1 张，再传给「从图像提取文字」。这一步会受 iOS 版本与照片权限影响，应在手机上用一张 TNG 截图验证。没有截屏触发器时，使用截图的分享菜单运行同一快捷指令。

## 限制

- 目前识别规则覆盖提供的两种 TNG 详情页：`-RM` 支付与 `+RM` 从钱包接收。其他 TNG 页面、OCR 漏字、失败或处理中交易会拒绝导入。
- 从自己其他账户转入 TNG 属于账户间转账，不应作为收入。这个版本只导入支出或收入；这种情况请取消并在 JSave 手动记为转账。
- 直接通过接口提交后，已打开的 JSave PWA 需联网同步才能看到新交易。
- 密钥每日最多创建 100 笔交易；超过限制需隔天再试。
