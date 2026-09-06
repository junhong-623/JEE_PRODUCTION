export const ARTICLES = [
  {
    slug: 'offline-expense-tracking',
    image: '/articles/offline-expense-tracking.webp',
    publishedAt: '2026-09-06',
    locales: {
      zh: {
        category: '离线记账',
        title: '没有网络时，怎样可靠记账？',
        deck: '真正可靠的离线记账，不只是“页面还能打开”，而是每一笔修改都先安全落地、能看见同步状态，并在网络回来后只同步一次。',
        readingTime: '约 12 分钟',
        imageAlt: '雨天的吉隆坡咖啡店里，桌上放着收据、钱包、笔记本与未显示界面的手机',
        takeawaysTitle: '先记住这四件事',
        takeaways: [
          '断网时先写入设备，而不是让用户等待服务器回应。',
          '每次新增、修改与删除都要进入可重试的同步队列。',
          '本地资料必须按账号隔离，不能让上一位用户的缓存出现在下一位用户面前。',
          '离线不是备份；重要记录仍应同步并定期导出。',
        ],
        sections: [
          {
            title: '离线记账为什么比想象中更重要',
            paragraphs: [
              '记账发生的地方，往往不是网络最稳定的地方。地下停车场付停车费、LRT 里补记早餐、商场收银台、旅行途中使用漫游网络，甚至只是手机在 Wi-Fi 与移动数据之间切换，都可能让一次普通请求失败。若应用要求每一笔记录都先抵达云端，用户看到的就会是转圈、错误提示，或最糟糕的情况：以为已经保存，回头却找不到。',
              '记账又是一种非常依赖当下的行为。金额、类别和付款账户在付款后最清楚，拖到晚上才补记，遗漏率会迅速上升。因此，可靠的设计目标不该是“网络好时很快”，而应该是“无论网络怎样，按下保存就有明确结果”。',
              '浏览器本身已经具备建立这种体验的基础。Service Worker 可以缓存应用运行所需的页面与资源；IndexedDB 则适合保存结构化资料，而且读写发生在事务中。它们让网页应用可以先在本机完成工作，再把网络视为稍后同步的通道。',
            ],
          },
          {
            title: '“可以离线打开”不等于“可以可靠离线记账”',
            paragraphs: [
              '有些应用只缓存了首页。断网后页面确实能出现，但新增记录仍直接调用服务器；一按保存便失败。这只能算离线外壳，不能算离线数据能力。另一些应用会把资料暂存在内存里，页面刷新或系统回收浏览器进程后，尚未上传的记录就消失。',
              '可靠离线需要同时解决三个层次：应用能启动、资料能持久保存、修改能在之后正确同步。任何一个层次缺失，用户都可能遇到“看起来可以用，实际上不可信”的体验。',
            ],
            list: [
              '应用外壳：断网时仍能载入必要的 HTML、CSS、JavaScript 与图标。',
              '本地数据库：交易、账户、目标和设置先写入设备上的持久储存。',
              '同步协议：网络恢复后重试，而且不会因为重复执行而产生两笔相同记录。',
            ],
          },
          {
            title: '一个可靠流程应该怎样运作',
            paragraphs: [
              '最稳妥的操作顺序是 local-first。用户按下保存后，应用先产生稳定的记录 ID，把完整资料写入本地数据库，并立刻更新画面。网络可用时再尝试上传；上传失败或设备离线，就把同一项操作放进持久同步队列。这样，“保存成功”代表资料已经安全留在这台设备上，而不是代表某个远端请求刚好成功。',
              '队列中的操作需要描述清楚对象、动作和资料，例如“为 transaction/abc 写入这个版本”或“删除 item/xyz”。网络回来后逐项执行，成功才从队列移除，失败则保留到下次重试。使用固定 ID 的写入比每次让服务器新增一条记录更安全，因为同一操作重试两次，结果仍是同一条资料。',
              'JSave 采用这种本地优先思路：交易等资料先写入按用户分开的 IndexedDB；线上写入失败时进入队列；重新连接后再冲刷队列。云端快照抵达时，也会先与尚未同步的本地操作合并，避免刚离线新增的记录短暂消失，或已经离线删除的记录突然“复活”。',
            ],
            callout: {
              title: '一次保存，应该只有一个结果',
              body: '重试是正常情况，不是异常情况。关键是让同一项操作无论执行一次还是多次，都落到同一个记录 ID，而不是制造重复交易。',
            },
          },
          {
            title: '账号隔离是离线数据库最容易忽略的边界',
            paragraphs: [
              '如果一台平板或电脑曾登录多个账号，本地缓存不能只用一个共同数据库。否则用户 A 登出后，用户 B 可能在云端资料抵达前看到 A 的余额或交易；更严重时，旧同步队列还可能把 A 的修改写进 B 的路径。',
              '较安全的做法是让每个 UID 拥有独立数据库，所有本地读写函数都必须收到明确 UID，同步队列的每一项也保存所有者。账号切换时，画面状态先清空，再载入新账号的本地资料；冲刷队列时只处理当前所有者的操作。',
              '这种隔离不只是隐私细节，也是资料正确性要求。财务应用里的“短暂显示错误”仍然是错误，因为使用者会根据眼前余额做决定。',
            ],
          },
          {
            title: '冲突、删除与多设备：网络恢复后的真正难题',
            paragraphs: [
              '离线期间，手机和电脑可能修改同一条资料。系统必须预先决定冲突规则：最后修改时间优先、字段级合并，或把冲突交给用户选择。小型个人账本通常可以采用明确的最后写入规则，但应该保存 updatedAt，并避免用服务器快照无条件覆盖尚未上传的本地版本。',
              '删除尤其需要谨慎。只从本地列表移除并不足够；系统需要保留“删除意图”，直到云端确认成功，否则远端旧记录会在下一次下载时回来。这通常通过队列中的 delete 操作或 tombstone（删除标记）完成。',
              '多设备同步也意味着画面应区分“本机已保存”和“云端已同步”。用户不需要看技术日志，但至少要知道自己能否安全换设备。一个诚实的离线提示、待同步数量或失败状态，比永远显示绿色勾号更值得信任。',
            ],
          },
          {
            title: '作为用户，你可以怎样减少遗漏风险',
            paragraphs: [
              '再好的离线架构也不是永久备份。浏览器资料可能因用户清除网站数据、无痕模式、系统储存压力或换机而消失。离线的价值是让你在连接不稳定时继续工作，不是承诺资料永远只留在这台设备也不会丢。',
            ],
            list: [
              '第一次使用时先在线完成登录，并等待初始资料载入。',
              '断网记账后不要立即清除浏览器数据或卸载应用。',
              '回到稳定网络后打开应用，确认离线提示消失且没有同步错误。',
              '重要账本定期导出 CSV，保存到自己控制的位置。',
              '换手机或重装前，先在另一台设备确认云端资料完整。',
            ],
          },
          {
            title: '怎样判断一款记账工具的离线能力是否可信',
            paragraphs: [
              '最简单的测试不是看宣传文案，而是亲自制造失败：在线打开一次应用，开启飞行模式，新增、修改和删除几笔测试资料，然后完全关闭应用再重新打开。资料应该仍在。恢复网络后，用另一台设备检查结果；同一笔不应重复，删除的项目也不应回来。',
              '还可以观察应用有没有把同步状态说清楚。真正尊重用户的工具会承认网络与同步可能失败，并提供恢复路径。只要遇到断网就禁止输入，或在后台失败却没有任何提示，都说明资料可靠性仍有缺口。',
              'JSave 想解决的正是这个日常问题：在消费发生时先把记录留下，网络回来后再继续同步。安静的体验背后，需要的是明确的数据所有权、持久队列和可重复执行的操作，而不只是一个“支持离线”的标签。',
            ],
          },
        ],
        sourcesTitle: '资料与延伸阅读',
        sources: [
          { label: 'MDN：IndexedDB API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API', note: '浏览器端结构化资料与事务储存。' },
          { label: 'MDN：Service Worker API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API', note: '离线资源、请求拦截与背景能力。' },
          { label: 'MDN：PWA 的离线与背景操作', url: 'https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation', note: '离线缓存与背景同步的工作方式及限制。' },
        ],
      },
      en: {
        category: 'Offline money tracking',
        title: 'How can expense tracking remain reliable without internet?',
        deck: 'Reliable offline tracking means more than loading a screen. Every change should land safely on the device, expose an honest sync state, and reach the cloud exactly once when connectivity returns.',
        readingTime: '12 min read',
        imageAlt: 'A rainy Kuala Lumpur café table with a receipt, wallet, notebook and a phone showing no interface',
        takeawaysTitle: 'Four ideas to keep',
        takeaways: [
          'Write to the device first instead of making the user wait for a server response.',
          'Persist every create, update and delete in a retryable synchronization queue.',
          'Separate local data by user ID so one account can never inherit another account’s cache.',
          'Offline storage is not a backup; important records should still sync and be exported regularly.',
        ],
        sections: [
          {
            title: 'Expense tracking happens where networks fail',
            paragraphs: [
              'People record money in car parks, trains, mall basements, cafés and while travelling. Even an ordinary handover between Wi-Fi and mobile data can interrupt a request. When an app requires every entry to reach its server before it can be considered saved, a small purchase turns into a spinner, an error, or a record that looked complete but later vanished.',
              'The detail is also freshest at the moment of payment. Amount, category and account are obvious then, but easy to forget at night. A reliable product therefore should not merely be fast on a good connection. Pressing Save should produce a clear result under imperfect conditions.',
              'Modern browsers provide the foundations for that experience. A service worker can retain the resources needed to launch an app, while IndexedDB stores structured records using transactions. Together they let the product complete useful work locally and treat the network as a later delivery channel.',
            ],
          },
          {
            title: 'An offline shell is not offline data',
            paragraphs: [
              'Some products cache only their home screen. The interface appears in airplane mode, but creating an entry still calls a server and fails. Others keep pending data only in memory, so a refresh or a browser process being reclaimed removes it. Both experiences look offline until the moment reliability matters.',
              'A dependable offline design solves three separate layers: the application can start, records persist, and later changes synchronize correctly. Missing any one of them creates an app that is available but cannot be trusted.',
            ],
            list: [
              'Application shell: the essential HTML, CSS, JavaScript and icons remain available.',
              'Local database: transactions, accounts, goals and settings are committed to durable device storage.',
              'Sync protocol: operations retry after reconnection without producing duplicates.',
            ],
          },
          {
            title: 'The reliable sequence is local first',
            paragraphs: [
              'When the user saves, the app should create a stable record ID, commit the full object to its local database and update the interface immediately. It can then try the network. If that request fails, the same operation enters a persistent queue. “Saved” now means the device has the record, not that a remote request happened to finish.',
              'Each queued operation should identify its owner, store, action and data: for example, write transaction/abc at this version, or delete item/xyz. A successful upload removes it from the queue; a failure leaves it for another attempt. Writing repeatedly to a fixed ID is safer than asking the server to create a fresh row every time, because retries converge on one record.',
              'JSave follows this local-first pattern. Finance records are written to an IndexedDB database separated by user. Failed online writes are queued and flushed after reconnection. When a cloud snapshot arrives, pending local operations are reconciled with it so an offline addition does not briefly disappear and an offline deletion is not immediately resurrected.',
            ],
            callout: { title: 'One action should have one outcome', body: 'Retries are normal. The important property is idempotency: running the same operation once or several times must resolve to the same record instead of creating duplicate spending.' },
          },
          {
            title: 'Account isolation is a data boundary, not a cosmetic detail',
            paragraphs: [
              'A shared tablet or computer may have seen several accounts. If the product uses one common local database, account B can briefly see account A’s balance before new cloud data arrives. Worse, an old queue might send A’s pending operation to the wrong remote path.',
              'A safer system gives every UID its own database, requires a UID for all local operations and stores the owner on every queue entry. On an account change, the interface clears before the next database hydrates. A queue flush processes only entries belonging to the active user.',
              'This is both privacy and correctness. In finance software, even a temporary wrong balance can influence a real decision.',
            ],
          },
          {
            title: 'Conflicts, deletions and multiple devices',
            paragraphs: [
              'A phone and laptop may edit the same record while one is offline. The app needs an explicit conflict rule: latest update wins, fields merge, or the user chooses. A small personal ledger can use a clear last-write rule, but it should preserve update timestamps and never let a remote snapshot blindly overwrite a pending local version.',
              'Deletion needs extra care. Removing an item from a local array is not enough; the intention to delete must remain until the server confirms it. Otherwise the remote copy returns on the next download. A queued delete operation or tombstone usually represents that intent.',
              'The interface should also distinguish saved on this device from synchronized to the cloud. Users do not need a technical log, but they do need to know whether it is safe to change devices. An honest offline banner, pending count or error state builds more trust than a permanent green tick.',
            ],
          },
          {
            title: 'What users can do to reduce risk',
            paragraphs: [
              'Offline capability is not permanent backup. Browser data can disappear when site storage is cleared, private mode ends, the operating system reclaims storage, or a device is replaced. Offline means work can continue through a connection problem; it does not promise that a single device is indestructible.',
            ],
            list: [
              'Complete the first sign-in online and allow the initial ledger to load.',
              'After recording offline, do not immediately clear browser data or uninstall the app.',
              'Open the app on a stable connection and confirm that no sync error remains.',
              'Export important ledgers to CSV and keep the file somewhere you control.',
              'Before replacing a phone, confirm the full ledger from another device.',
            ],
          },
          {
            title: 'A practical offline reliability test',
            paragraphs: [
              'Do not rely on a feature badge. Open the app online once, enable airplane mode, then create, edit and delete several test records. Fully close the app and reopen it. The records should still reflect every change. Reconnect and check from another device: there should be no duplicate entry, and deleted records should not return.',
              'Notice whether the product communicates sync status. A trustworthy tool acknowledges that networks and uploads can fail, then offers a recovery path. Blocking all input offline—or failing silently in the background—reveals a gap in reliability.',
              'This is the daily problem JSave is designed around: capture the transaction while it is fresh, then continue synchronization when the network returns. A quiet interface depends on explicit ownership, durable queues and repeatable operations, not merely an “offline supported” label.',
            ],
          },
        ],
        sourcesTitle: 'Sources and further reading',
        sources: [
          { label: 'MDN: IndexedDB API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API', note: 'Structured browser storage and transactions.' },
          { label: 'MDN: Service Worker API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API', note: 'Offline resources, request interception and background capabilities.' },
          { label: 'MDN: Offline and background operation', url: 'https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation', note: 'How PWA caching and background synchronization work, including their limits.' },
        ],
      },
    },
  },
  {
    slug: 'malaysia-daily-budget',
    image: '/articles/malaysia-daily-budget.webp',
    publishedAt: '2026-09-06',
    locales: {
      zh: {
        category: '马来西亚预算',
        title: '马来西亚用户，怎样安排真正可执行的每日预算？',
        deck: '预算不该只是月底才发现超支的报表。先处理固定责任、储蓄与非每月开销，再把真正可动用的钱换算成今天的决定。',
        readingTime: '约 14 分钟',
        imageAlt: '木桌上的马来西亚早餐、交通卡、钥匙、蔬菜、令吉与预算笔记本',
        takeawaysTitle: '一套可以今天开始的方法',
        takeaways: [
          '用税后到手收入规划，不用名义薪资。',
          '先预留固定支出、储蓄和年度开销，再计算弹性消费池。',
          '每日预算是动态导航，不是每天必须花完的配额。',
          '用自己的真实记录修正比例；全国平均数只能当参考。',
        ],
        sections: [
          {
            title: '为什么“每月 RM X”仍然很难执行',
            paragraphs: [
              '月预算适合规划，却不适合站在柜台前做决定。看到“本月餐饮 RM900”，你仍然不知道今天花 RM18 是否合理，因为答案还取决于这个月过了几天、之前花了多少，以及月底是否有保险、车险或家庭责任。',
              '每日预算的意义，是把剩余弹性金额除以剩余时间，产生一个当下可以理解的速度表。它不是要求每天完全一样，也不是把房租切成三十份；它只是回答一个实用问题：按照目前进度，从今天到月底，平均每天还有多少可以自由安排？',
            ],
          },
          {
            title: '第一步：先算真正到手的钱',
            paragraphs: [
              '从实际进入银行账户的收入开始，包括扣除 EPF、SOCSO、EIS、PCB 后的薪资，以及相对稳定的副业收入。奖金、花红和不固定佣金不宜预先当成每个月都有；它们可以在收到后再分配给储蓄、债务、年度支出或适度奖励。',
              '如果收入每月变化，可以使用最近三至六个月中较保守的平均值，或直接以最低常见月份作为基础。预算的首要目标是可持续，不是把最乐观的月份写得很漂亮。',
            ],
          },
          {
            title: '第二步：把钱分成四层，而不是只套一个比例',
            paragraphs: [
              '50/30/20 可以作为第一次检查，但马来西亚不同城市、交通方式和家庭结构的差距很大。KWSP 的 Belanjawanku 2024/2025 指南估算，巴生谷单身公共交通用户每月最低开销约 RM1,970，单身车主则约 RM2,800。光是交通方式就形成 RM830 差距，所以固定把每个人塞进同一比例，往往不够贴近现实。',
              '更实用的方法是先按责任顺序分层。第一层是不能拖欠的固定生活责任；第二层是未来一定会发生、但不是每月出现的费用；第三层是先支付给未来自己的储蓄；最后剩下的才是能够按日调整的弹性消费。',
            ],
            list: [
              '固定责任：房租或房贷、水电、电话、最低债务还款、托儿、固定家庭支持。',
              '偿债与沉淀资金：车险、路税、维修、医疗、节庆、旅行和设备更换。',
              '储蓄目标：紧急预备金、短期目标和长期投资；金额不必一开始很高，但应在发薪后先留。',
              '弹性消费：饮食、杂货、油费、e-hailing、社交、咖啡、娱乐和临时购买。',
            ],
          },
          {
            title: '第三步：算出“今天可调整的钱”',
            paragraphs: [
              '公式可以保持简单：弹性消费池 = 到手收入 − 固定责任 − 储蓄 − 沉淀资金。月初每日参考额 = 弹性消费池 ÷ 当月天数。进入月中后，不要继续使用原来的数字，而应改为：当前弹性余额 ÷ 剩余天数。',
              '例如，到手收入 RM3,500；房租水电与固定账单 RM1,100；通勤 RM450；电话、保险与家庭责任 RM250；紧急储蓄和目标 RM500；车险、维修或年度费用的沉淀资金 RM200。剩下 RM1,000 作为食物、杂货、社交与其他弹性开销。30 天月份的起始参考额约为 RM33.33。',
              '如果前十天只用了 RM260，剩余 RM740、还有 20 天，新的每日参考额是 RM37；若已用了 RM420，则只剩 RM580，每日参考额变为 RM29。这个数字会跟着行为变化，所以它比静态的“每天 RM33”更诚实。',
            ],
            callout: {
              title: '每日预算不是“今天必须花掉”',
              body: '今天少花 RM15，不代表失去 RM15；它让明天、周末或月底拥有更多空间。每日数字是节奏，不是优惠券。',
            },
          },
          {
            title: '马来西亚生活里最容易漏掉的预算项目',
            paragraphs: [
              '许多预算失败，不是因为一杯 kopi，而是因为把不规则但可预见的费用当成意外。车主会遇到路税、保险、轮胎、保养、停车与 Touch ’n Go 充值；租屋者可能要处理押金、搬家和家电；家庭则有开学、节庆红包、回乡交通与医疗支出。',
              '这些费用适合使用沉淀资金：估算下一次金额与日期，再按剩余月份分摊。例如一年后 RM1,200 的车险，每月先留 RM100。实际付款时不会摧毁当月预算，也不会误以为信用卡替你解决了问题。',
              'e-wallet 与信用卡也会制造时间错觉。充值不是消费本身，刷卡当天才是消费；若等到账单日才记录，类别和日期都会失真。最清楚的方式是在交易发生时记支出，并把信用卡还款视为账户之间的结算，而不是第二次消费。',
            ],
          },
          {
            title: '怎样使用官方数据，而不让平均数替你做决定',
            paragraphs: [
              'DOSM 的 2024 家庭开销调查显示，马来西亚家庭平均每月消费 RM5,566；住房与公用设施、餐厅与住宿服务、食物与饮料、交通四大类合计占 67.2%。这说明大部分压力集中在少数基础类别，但“家庭平均”并不是个人应该照抄的预算。家庭人数、城市、是否开车、是否与父母同住都会改变结果。',
              'Belanjawanku 更适合拿来做底线检查，因为它按城市和家庭类型估算达到合理生活水平所需的最低月开销。若你的必要支出明显高于相近类别，可以逐项检查原因；若明显低于，也要确认是否遗漏保险、维修、医疗或替换成本。它是参照点，不是评分表。',
            ],
          },
          {
            title: '储蓄不足时，顺序比完美比例更重要',
            paragraphs: [
              'KWSP 的个人理财资料通常建议准备约三至六个月生活开销的紧急预备金。不过，从零直接面对这个数字容易放弃。可以先建立 RM1,000 或一个月必要开销的小缓冲，再逐步增加。每次发薪先自动或手动转入固定金额，比月底“看剩多少再存”更可靠。',
              '如果现金流很紧，先确保住处、食物、交通、基本医疗和最低债务还款；然后建立小型紧急缓冲；再处理高成本债务，并扩大预备金。任何比例都不应该迫使你延迟必要医疗或欠付基本账单。',
              'JSave 的目标功能适合把大数字拆成可见进度，而每日预算则负责保护当月现金流。两者分开，能避免为了达成目标而低估真实生活成本。',
            ],
          },
          {
            title: '每周十分钟的调整，比月底检讨更有用',
            paragraphs: [
              '预算不是一次设定后永远不动。每周选择固定时间，查看弹性余额、未来七天事件和分类趋势。若周末有聚餐，就提前降低几天的可选消费；若交通或杂货持续超标，先检查预算是否不现实，再决定是否改变行为。',
              '月底只做三件事：找出一个被低估的必要类别、一个没有带来足够价值的弹性类别，以及一个下月要预留的非每月费用。一次调整一两项，通常比重新设计整份预算更容易坚持。',
              '好的预算不会让每一天都充满内疚。它应该让固定责任有位置、未来费用有准备、储蓄有进度，同时让今天的选择仍保有自由。每日预算真正提供的不是限制，而是提早知道“现在改变还来得及”。',
            ],
          },
        ],
        sourcesTitle: '数据来源与说明',
        sources: [
          { label: 'KWSP：Belanjawanku 2024/2025 与退休充足框架', url: 'https://www.kwsp.gov.my/en/w/epf-releases-belanjawanku-2024/2025-and-retirement-income-adequacy-framework', note: '按城市和家庭类型估算合理生活的最低月开销。' },
          { label: 'DOSM：2024 马来西亚家庭开销调查', url: 'https://www.dosm.gov.my/portal-main/release-content/household-expenditure-survey-report--malaysia--states', note: '全国与各州家庭消费金额及类别占比。' },
          { label: 'KWSP：什么是紧急预备金？', url: 'https://www.kwsp.gov.my/en/w/article/emergency-fund', note: '三至六个月开销的常见参考与建立方法。' },
        ],
        disclaimer: '本文提供一般预算教育，不构成针对个人情况的财务建议。数据是参考值，请按收入、债务、家庭责任、城市与健康需要调整。',
      },
      en: {
        category: 'Budgeting in Malaysia',
        title: 'How should Malaysians build a daily budget that actually works?',
        deck: 'A budget should not be a report that announces overspending at month-end. Reserve fixed responsibilities, savings and non-monthly costs first, then translate genuinely flexible money into a decision for today.',
        readingTime: '14 min read',
        imageAlt: 'A Malaysian breakfast, transit card, keys, groceries, ringgit and a budget notebook on a timber table',
        takeawaysTitle: 'A method you can start today',
        takeaways: [
          'Plan from take-home pay, not headline salary.',
          'Reserve fixed costs, savings and annual expenses before calculating flexible spending.',
          'A daily budget is dynamic navigation, not an amount you are expected to use up.',
          'Adjust ratios from your own records; national averages are only reference points.',
        ],
        sections: [
          {
            title: 'Why a monthly number is still hard to use',
            paragraphs: [
              'A monthly budget is useful for planning but weak at a checkout. “RM900 for dining” does not tell you whether RM18 today is comfortable. The answer also depends on how far the month has progressed, how much has already been used and whether insurance, school costs or family commitments are still ahead.',
              'A daily budget converts the remaining flexible amount and remaining time into a speedometer. It does not pretend every day is identical or divide rent into thirty artificial pieces. It answers one practical question: at the current pace, how much flexible room remains per day until month-end?',
            ],
          },
          {
            title: 'Start with money that actually arrives',
            paragraphs: [
              'Use the amount reaching your bank after EPF, SOCSO, EIS and PCB, plus side income that is reasonably dependable. A bonus, commission or annual payout should not be promised to recurring expenses before it arrives. Allocate it after receipt to savings, debt, sinking funds or a deliberate reward.',
              'For variable income, use a conservative three-to-six-month average or the lowest normal month. A budget needs to survive an ordinary month, not flatter the best one.',
            ],
          },
          {
            title: 'Use four layers before a fixed ratio',
            paragraphs: [
              'The 50/30/20 rule is a useful first check, but Malaysian costs vary substantially by city, transport and household. EPF’s Belanjawanku 2024/2025 estimates RM1,970 per month for a single public-transport user in the Klang Valley and RM2,800 for a single car owner. Transport choice alone creates an RM830 difference, so one universal ratio cannot describe every life.',
              'A more practical approach allocates by responsibility. Protect non-negotiable living costs first, then predictable but non-monthly obligations, then pay your future self. Only the remainder becomes spending that can be adjusted day by day.',
            ],
            list: [
              'Fixed responsibilities: housing, utilities, phone, minimum debt payments, childcare and regular family support.',
              'Debt and sinking funds: car insurance, road tax, repairs, healthcare, festivals, travel and device replacement.',
              'Savings goals: emergency cash, near-term goals and long-term investing; start small if necessary, but reserve it after payday.',
              'Flexible spending: food, groceries, fuel, e-hailing, coffee, social plans, entertainment and spontaneous purchases.',
            ],
          },
          {
            title: 'Calculate the money that can still move',
            paragraphs: [
              'Keep the formula simple: flexible pool = take-home income − fixed responsibilities − savings − sinking funds. At the start of a month, divide the pool by the number of days. Later, recalculate as current flexible balance ÷ remaining days rather than continuing to show the original number.',
              'Suppose take-home pay is RM3,500. Housing, utilities and fixed bills cost RM1,100; commuting RM450; phone, insurance and family commitments RM250; emergency and goal savings RM500; annual-cost sinking funds RM200. That leaves RM1,000 for food, groceries, social activity and other flexible choices, or about RM33.33 at the start of a 30-day month.',
              'If the first ten days use only RM260, RM740 remains for 20 days and the new reference is RM37. If they use RM420, only RM580 remains and the pace becomes RM29. The moving number is more honest than repeating “RM33 per day” after reality has changed.',
            ],
            callout: { title: 'A daily budget is not a coupon', body: 'Spending RM15 less today does not waste the allocation. It creates more room for tomorrow, the weekend or the end of the month. The number describes pace, not permission to consume.' },
          },
          {
            title: 'The Malaysian costs people commonly forget',
            paragraphs: [
              'Many plans fail because irregular but predictable costs are labelled emergencies. A car brings road tax, insurance, tyres, service, parking and Touch ’n Go top-ups. Renters face deposits, moves and appliances. Families plan for school terms, festive giving, balik kampung travel and medical spending.',
              'Use sinking funds: estimate the next amount and date, then divide by the months remaining. A RM1,200 insurance bill due in a year becomes RM100 set aside each month. Payment no longer destroys that month’s plan or hides behind a credit-card balance.',
              'E-wallets and credit cards also create timing confusion. A wallet top-up is not the underlying purchase, and the card purchase—not the statement payment—is the expense event. Recording at the transaction date keeps categories honest; paying the card is an account settlement rather than a second expense.',
            ],
          },
          {
            title: 'Use official data as a benchmark, not a command',
            paragraphs: [
              'DOSM’s 2024 Household Expenditure Survey reports mean Malaysian household consumption of RM5,566 per month. Housing and utilities, restaurants and accommodation, food and beverages, and transport together account for 67.2%. Most pressure concentrates in a few fundamentals, but a household mean is not a personal target.',
              'Belanjawanku is more useful as a floor check because it estimates a reasonable minimum by city and household type. If your essential costs are materially above a comparable profile, inspect the difference. If they are far below it, check whether insurance, maintenance, healthcare or replacement costs were omitted. A benchmark starts a question; it does not grade your life.',
            ],
          },
          {
            title: 'When savings are small, sequence beats a perfect ratio',
            paragraphs: [
              'EPF financial education commonly points to three to six months of living costs for an emergency fund. From zero, that number can feel paralysing. Build a first buffer of RM1,000 or one month of essentials, then extend it. Moving a fixed amount after payday is more dependable than saving whatever happens to remain.',
              'With tight cash flow, protect housing, food, transport, basic healthcare and minimum debt payments. Next create a small emergency buffer, address expensive debt and then expand the fund. No ratio should force someone to delay necessary healthcare or default on essential bills.',
              'JSave goals can make a large target visible while the daily budget protects current cash flow. Keeping those jobs separate prevents an ambitious target from disguising the real cost of living.',
            ],
          },
          {
            title: 'Ten minutes each week beats a month-end post-mortem',
            paragraphs: [
              'Choose one weekly moment to review the flexible balance, the next seven days and category direction. If dinner plans are coming, make room before the weekend. If transport or groceries repeatedly exceed the plan, first ask whether the budget was unrealistic, then decide whether behaviour can change.',
              'At month-end, identify one necessary category that was underestimated, one flexible category that returned too little value and one non-monthly cost to reserve next month. Adjusting one or two things is easier to sustain than rebuilding the entire spreadsheet.',
              'A good budget should not manufacture guilt every day. It gives responsibilities a place, prepares future costs, moves savings forward and preserves freedom inside today’s choices. The real benefit of a daily pace is learning early enough that a small correction can still work.',
            ],
          },
        ],
        sourcesTitle: 'Data sources and notes',
        sources: [
          { label: 'EPF: Belanjawanku 2024/2025 and retirement adequacy framework', url: 'https://www.kwsp.gov.my/en/w/epf-releases-belanjawanku-2024/2025-and-retirement-income-adequacy-framework', note: 'Reasonable minimum monthly expenditure by city and household type.' },
          { label: 'DOSM: Household Expenditure Survey Report 2024', url: 'https://www.dosm.gov.my/portal-main/release-content/household-expenditure-survey-report--malaysia--states', note: 'National and state household consumption and category shares.' },
          { label: 'EPF: What is an emergency fund?', url: 'https://www.kwsp.gov.my/en/w/article/emergency-fund', note: 'The common three-to-six-month reference and ways to build a fund.' },
        ],
        disclaimer: 'This article provides general budgeting education, not personalised financial advice. Adapt the examples to your income, debt, family responsibilities, city and health needs.',
      },
    },
  },
  {
    slug: 'jsave-vs-expense-apps',
    image: '/articles/jsave-vs-expense-apps.webp',
    publishedAt: '2026-09-06',
    locales: {
      zh: {
        category: '产品选择',
        title: 'JSave 与一般记账 App 有什么不同？',
        deck: '不是功能越多就越适合每天使用。JSave 选择手动、离线优先和清楚的数据出口，换取更少干扰与更明确的金钱意识。',
        readingTime: '约 11 分钟',
        imageAlt: '吉隆坡居家书桌上，从杂乱收据过渡到一部手机和整齐笔记本的画面',
        takeawaysTitle: '先说结论',
        takeaways: [
          '需要自动银行汇入和复杂投资分析的人，传统大型理财 App 通常更合适。',
          '想主动记账、离线使用、AA 分账并随时导出的人，会更接近 JSave 的设计对象。',
          'JSave 不索取银行登录资料，但手动记录也意味着用户要建立一个轻量习惯。',
          '选择工具时应比较资料所有权与日常摩擦，不要只数功能数量。',
        ],
        sections: [
          {
            title: '大多数记账 App 在解决什么问题',
            paragraphs: [
              '一般个人理财 App 常以“尽量自动”为目标：连接银行、导入信用卡交易、猜测类别、显示大量图表，再透过通知提醒用户回来看。这对拥有许多账户、需要统一查看净资产，或不愿逐笔输入的人非常有价值。',
              '但自动化也带来新的维护工作。银行连接可能失效，商家名称需要重新分类，转账可能被当成支出，同一笔交易可能因 pending 与 posted 状态重复。用户少了输入，却不一定少了核对。不同国家和银行的支援程度也不一致。',
              '因此，JSave 没有把“没有银行连接”当成尚未完成的功能，而是把手动输入视为明确选择：只记录用户决定进入账本的资料，保持流程短，并让应用在网络不好时仍能完成记录。',
            ],
          },
          {
            title: '真正的差异不是手动或自动，而是谁控制账本',
            paragraphs: [
              '自动导入的优势是覆盖全面；手动记录的优势是意图清楚。你知道一笔是自己的午餐、朋友稍后会偿还的共同账单，还是从储蓄转到现金的账户移动。系统不必仅凭商家名称猜测。',
              '当然，手动也有成本：忘记记录就没有资料。如果一个工具需要十几个字段、复杂标签和多层确认，习惯很快会中断。JSave 的做法是把常用新增流程压缩到金额、类型、类别与账户，并把更丰富的内容留给真正需要的场景。',
              '这也是为什么“最自动”不必然等于“最清楚”。理想工具取决于你愿意投入哪一种维护：花几秒主动记录，或定期检查自动导入的结果。',
            ],
          },
          {
            title: 'JSave 把哪些功能放在核心位置',
            paragraphs: [
              'JSave 围绕日常决定，而不是金融账户聚合。首页关注今日支出、当前节奏与账户余额；报告负责回看类别与趋势；目标把未来购买或计划变成可追踪进度。所有这些功能都建立在同一份主动记录的账本上。',
            ],
            list: [
              '离线优先记录：网络中断时先保存到设备，之后再同步。',
              'AA 分账：可平均或自定义每个人金额，并追踪还款；报告只计算自己的实际份额。',
              '动态预算反馈：把本月弹性余额换成今天可理解的消费节奏。',
              '目标与快速存入：分开管理旅行、设备、紧急金等多个目标。',
              '物品日均成本：把电脑、相机或组合升级按实际持有天数理解，而不只是购买当天的一笔大额。',
              'CSV 导出：资料可以进入 Excel、Google Sheets 或自己的长期备份。',
            ],
          },
          {
            title: 'AA 分账为什么不只是把总额除以人数',
            paragraphs: [
              '聚餐时由一个人先付 RM168，如果记账工具直接把 RM168 全部算成付款人的餐饮支出，月报就会夸大；朋友转回 RM126 时若又被当成收入，收入报告也会失真。真实情况是付款人的个人支出可能只有 RM42，其余是短期应收。',
              'JSave 保存完整账单和参与者，可以平均分，也可以为不同餐点自定义金额。朋友还款时更新结清状态，而个人消费报告只计算自己的份额。这样既保留账户现金流，也保留支出的经济意义。',
              '这类场景在朋友聚餐、共同购买礼物、旅行或合租生活中很常见，却不一定是传统个人记账工具的核心。它也是 JSave 与纯粹支出分类器之间最明显的差异之一。',
            ],
          },
          {
            title: '物品日均成本提供的是另一种时间视角',
            paragraphs: [
              '传统账本会在购买电脑当天记录 RM4,000，之后那台电脑便从财务视野消失。但实际价值是在之后数年逐渐产生。若一年后加入 RM300 RAM 和 RM450 SSD，把组件放进同一组合并保留各自购买日期，就能看到整个系统到今天的累计成本与日均成本。',
              '出售或退役某个组件时，组合可以只计算仍在使用的部分，同时保留历史记录。这不是会计折旧，也不预测二手价值；它回答的是更生活化的问题：我持续使用这件东西后，原本昂贵的购买是否变得值得？',
              '这种视角有助于比较“频繁买便宜物品”和“长期使用较好物品”，也能让储蓄目标和购买决定连接起来。',
            ],
          },
          {
            title: '功能比较：哪一种方式更适合你',
            paragraphs: [
              '下面不是胜负表，而是设计取向。不同生活阶段可以需要不同答案。',
            ],
            table: {
              headers: ['比较项目', 'JSave', '一般大型记账 App'],
              rows: [
                ['交易来源', '主动手动记录', '常见手动＋银行自动导入'],
                ['断网使用', '核心记录可离线完成', '依产品而异，自动同步通常需联网'],
                ['银行凭证', '不要求提供', '连接银行的产品通常需授权第三方存取'],
                ['共同账单', '平均／自定义 AA 与还款状态', '有些支持，有些需要额外 App'],
                ['预算反馈', '强调今日与剩余天数的节奏', '常见分类上限和月度报表'],
                ['拥有物品', '组合、购买日期与日均成本', '通常不属于核心功能'],
                ['数据出口', 'CSV 导出', '依方案而异，部分只在付费版提供'],
                ['维护成本', '需要持续、快速地手动记录', '需要维护连接并核对自动分类'],
              ],
            },
          },
          {
            title: 'JSave 不适合哪些需求',
            paragraphs: [
              '如果你需要实时同步十几个银行与投资账户、自动追踪股票组合、扫描收据、处理企业报销、与伴侣共同编辑同一个家庭账本，JSave 目前不是最完整的选择。清楚说明边界，比把每个需求都包装成“即将推出”更诚实。',
              '若你完全不愿手动输入，也很难从 JSave 获得完整报告。它适合愿意在付款后花几秒记录的人，并用这个动作换取对消费的主动觉察。',
              '你也可以采用混合方式：银行 App 负责核对月底总额，JSave 负责日常可执行预算、AA 账单、目标与重要物品。工具不必独占你的全部金融生活。',
            ],
          },
          {
            title: '选择记账 App 前，问这七个问题',
            paragraphs: [
              '功能列表很容易复制，长期体验则取决于细节。试用一周时，可以用下面的问题判断，而不是只看截图和下载量。',
            ],
            list: [
              '新增一笔真实支出需要多久？网络中断时会怎样？',
              '转账、信用卡还款与朋友还款会不会重复计算？',
              '报告显示的是账户现金流，还是我的真实个人支出？',
              '能否导出完整资料，而且格式是自己可以继续使用的？',
              '换账号或共用设备时，本地资料是否明确隔离？',
              '通知是在帮助我行动，还是只想把我拉回应用？',
              '三个月后，我愿意继续维持这套记录方式吗？',
            ],
          },
          {
            title: 'JSave 的取舍：重要的都有，多余的没有',
            paragraphs: [
              'JSave 并不试图成为银行、投资平台或财务顾问。它把范围留在个人日常：快速留下事实，看清这个月的节奏，正确处理共同账单，为目标存钱，并在需要时把资料带走。',
              '这种克制也意味着产品必须把少数功能做得可靠。离线记录若会丢、AA 若扭曲报告、CSV 若难以使用，再漂亮的首页也没有意义。相反，当这些基础行为稳定，应用可以安静地退到生活背景里。',
              '最好的记账工具不是拥有最多图表的那一个，而是你愿意长期使用、看得懂结果，也能随时离开的那一个。JSave 的答案是：让输入保持主动，让反馈保持平静，让资料仍然属于用户。',
            ],
          },
        ],
        sourcesTitle: '进一步了解',
        sources: [
          { label: 'JSave：无网络时怎样可靠记账', url: '/zh/articles/offline-expense-tracking/', note: '了解本地优先、同步队列与账号隔离。' },
          { label: 'JSave：马来西亚每日预算指南', url: '/zh/articles/malaysia-daily-budget/', note: '把月度现金流转换成每日可执行节奏。' },
        ],
      },
      en: {
        category: 'Choosing a money tool',
        title: 'How is JSave different from a typical expense tracking app?',
        deck: 'More features do not automatically create a better daily tool. JSave chooses manual entry, offline-first behaviour and a clear data exit in exchange for less noise and more deliberate awareness.',
        readingTime: '11 min read',
        imageAlt: 'A Kuala Lumpur home desk transitioning from scattered receipts to one phone and an orderly notebook',
        takeawaysTitle: 'The short answer',
        takeaways: [
          'People who need automatic bank imports and complex investment analysis will usually prefer a larger finance app.',
          'People who value deliberate entry, offline use, AA splitting and portable CSV data are closer to JSave’s intended fit.',
          'JSave never asks for bank credentials, but manual entry asks the user to keep a lightweight habit.',
          'Compare ownership and daily friction, not only the number of features.',
        ],
        sections: [
          {
            title: 'What most finance apps optimise for',
            paragraphs: [
              'Many personal finance products pursue maximum automation: connect banks, import card transactions, infer categories, display broad dashboards and send reminders. That is valuable for someone with many accounts who needs a consolidated net-worth view or strongly dislikes entering individual purchases.',
              'Automation creates its own maintenance. A bank connection expires, merchant names need recategorising, transfers appear as spending, or pending and posted card entries duplicate. The user types less but may still reconcile frequently. Bank coverage also varies by country and institution.',
              'JSave therefore treats the absence of bank connectivity as a design choice rather than an unfinished checkbox. Only data the user deliberately records enters the ledger, the capture path stays short, and a weak connection does not prevent the action.',
            ],
          },
          {
            title: 'The deeper difference is who controls the ledger',
            paragraphs: [
              'Automatic import wins on coverage; manual entry wins on intent. You know whether RM42 is your lunch, one share of a bill friends will repay, or money moving from savings to cash. The system does not have to infer meaning from a merchant string.',
              'Manual tracking has a cost: forgotten transactions do not exist. A form with a dozen fields, complex tags and repeated confirmation quickly destroys the habit. JSave keeps common capture centred on amount, type, category and account, while reserving richer detail for the situations that need it.',
              '“Most automatic” and “most clear” are not synonyms. The right tool depends on which maintenance you prefer: a few deliberate seconds after payment, or periodic review of imported results.',
            ],
          },
          {
            title: 'What JSave puts at the centre',
            paragraphs: [
              'JSave is organised around everyday decisions rather than financial aggregation. The home view prioritises today’s spending, current pace and account balances. Reports look back at categories and trends. Goals turn a future purchase or plan into visible progress. The same deliberate ledger connects them all.',
            ],
            list: [
              'Offline-first capture: save on the device during an interruption and synchronize later.',
              'AA splitting: divide equally or enter custom shares, track repayments and count only your own share in personal spending.',
              'Dynamic budget feedback: translate the remaining monthly pool into a pace that makes sense today.',
              'Goals and quick deposits: separate travel, equipment, emergency and other targets.',
              'Item cost per day: understand a computer, camera or upgrade group over the days it remains in use.',
              'CSV export: continue in Excel, Google Sheets or a backup under your control.',
            ],
          },
          {
            title: 'AA splitting is not just total divided by people',
            paragraphs: [
              'If one person pays a RM168 dinner and a tracker calls all RM168 their dining expense, the month is overstated. If RM126 returned by friends is then called income, income is distorted too. Economically, the payer may have spent RM42 and temporarily fronted the rest.',
              'JSave preserves the full bill and its participants, with equal or custom shares. A repayment changes settlement state while personal reports count only the user’s own portion. That keeps both account cash flow and the meaning of spending visible.',
              'This is common in meals, group gifts, travel and shared homes, yet it is not central to every personal expense tracker. It is one of the clearest distinctions between JSave and a simple category ledger.',
            ],
          },
          {
            title: 'Cost per day adds a different view of time',
            paragraphs: [
              'A conventional ledger records a RM4,000 computer on purchase day, then the computer disappears from view. Its value, however, unfolds over years. If RM300 of RAM and a RM450 SSD arrive later, grouping them while preserving individual purchase dates shows the system’s accumulated cost and cost per day.',
              'When a component is sold or retired, the active group can exclude it while retaining history. This is not accounting depreciation and does not predict resale value. It answers a more personal question: after sustained use, did an expensive purchase become worthwhile?',
              'That view helps compare frequently replacing cheap objects with using a better object for longer, and it connects a savings goal with the later reality of ownership.',
            ],
          },
          {
            title: 'A comparison of design choices',
            paragraphs: ['This is not a winner table. Different stages of life can need different answers.'],
            table: {
              headers: ['Area', 'JSave', 'Typical larger expense app'],
              rows: [
                ['Transaction source', 'Deliberate manual entry', 'Often manual plus automatic bank imports'],
                ['Offline use', 'Core capture works offline', 'Varies; automatic synchronization needs a connection'],
                ['Bank credentials', 'Not requested', 'Bank-connected products require third-party authorisation'],
                ['Shared bills', 'Equal/custom AA shares and repayment state', 'Sometimes included, sometimes a separate product'],
                ['Budget feedback', 'Today and remaining-day pace', 'Often category caps and monthly reports'],
                ['Owned items', 'Groups, dates and cost per day', 'Usually outside the core product'],
                ['Data exit', 'CSV export', 'Varies; sometimes limited to paid plans'],
                ['Maintenance', 'Requires quick, consistent manual capture', 'Requires connection upkeep and category review'],
              ],
            },
          },
          {
            title: 'When JSave is not the right fit',
            paragraphs: [
              'JSave is not currently the most complete choice for real-time aggregation of many banks and investment accounts, portfolio analytics, receipt scanning, business expenses or two people editing one household ledger together. Describing those boundaries is more useful than labelling every need “coming soon.”',
              'Someone unwilling to enter anything manually will not get a complete report. The product fits people prepared to spend a few seconds after payment in exchange for conscious awareness.',
              'A hybrid is valid: use a bank app to reconcile totals at month-end and JSave for an actionable daily budget, AA bills, goals and important items. One tool does not need to own an entire financial life.',
            ],
          },
          {
            title: 'Seven questions to ask before choosing an app',
            paragraphs: ['Feature lists are easy to copy; long-term experience lives in details. During a one-week trial, ask:'],
            list: [
              'How long does a real purchase take to add, and what happens without a connection?',
              'Are transfers, card repayments and friend repayments counted twice?',
              'Does the report show account cash flow or my actual personal spending?',
              'Can I export complete data in a format I can continue using?',
              'Are local records clearly isolated when accounts change on a shared device?',
              'Do notifications help me act, or merely pull me back into the app?',
              'Will I still maintain this routine three months from now?',
            ],
          },
          {
            title: 'JSave’s trade-off: what matters, without the noise',
            paragraphs: [
              'JSave does not try to become a bank, investment platform or financial adviser. Its boundary is personal daily money: preserve a fact quickly, understand the month’s pace, handle shared bills correctly, move towards goals and take the data elsewhere when needed.',
              'Restraint makes reliability more important. If offline capture loses entries, AA bills distort reports or CSV cannot be used, a beautiful home screen has little value. When those foundations are stable, the application can quietly recede into everyday life.',
              'The best tracker is not the one with the most charts. It is the one you can sustain, whose results you understand, and which you are free to leave. JSave’s answer is deliberate input, calm feedback and user-portable data.',
            ],
          },
        ],
        sourcesTitle: 'Continue reading',
        sources: [
          { label: 'JSave: reliable offline expense tracking', url: '/en/articles/offline-expense-tracking/', note: 'Local-first storage, queues and account isolation.' },
          { label: 'JSave: a practical daily budget for Malaysia', url: '/en/articles/malaysia-daily-budget/', note: 'Turn monthly cash flow into an actionable daily pace.' },
        ],
      },
    },
  },
]

export function getArticle(slug) {
  return ARTICLES.find(article => article.slug === slug) ?? null
}
