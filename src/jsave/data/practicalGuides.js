export const PRACTICAL_GUIDES = [
  {
    slug: 'item-installment-tracking',
    image: '/j-save-installment-laptop.webp',
    publishedAt: '2026-10-02',
    locales: {
      zh: {
        category: '物品与分期',
        title: '买了分期物品，怎样看清已付与待付款？',
        deck: '每月供款只是计划的一部分。把物品价格、首付、每期日期和实际付款放在一起，才能分清已经付了多少、未来还要付多少，以及账本里真正发生的支出。',
        readingTime: '约 6 分钟',
        imageAlt: '阳光书桌上的笔电与记事本，代表一件需要追踪分期付款的日常物品',
        takeawaysTitle: '先把计划和实际付款分开',
        takeaways: [
          '物品价格、首付和分期总额是不同的数字。',
          '到期日期不代表已经付款，过去已付期数要自己核对。',
          '已经有支出记录时关联已有交易，避免再记一笔。',
          '分期计划追踪进度；真正的支出仍来自实际付款交易。',
        ],
        sections: [
          {
            title: '先回答三个问题：多少钱、付了多少、还剩多少',
            paragraphs: [
              '买笔电时看到「每月 RM200」，很容易只记住这一个数字。可是每月金额并不能回答整件物品的价格、计划持续多久，或过去几个月到底有没有付清。JSave 把分期详情放在物品里，让购买本身和后续付款有一个共同的入口。你可以同时保留物品价格、购买日期，以及每一期的金额和日期。',
              '开始之前，把商家收据与付款计划放在旁边。以它们确认物品价格、首付、供款期数、首期日期和每月金额。下面的数字是虚构的等额示例，不代表任何商家方案；自己的计划应按实际资料填写。先填准确，之后查看剩余进度才有意义。',
            ],
          },
          {
            title: '在物品里建立分期计划',
            paragraphs: [
              '打开 JSave 的「目标」页面，切换到「物品」，新增或编辑那件物品。填好名称、价格与购买日期，再开启「分期付款」。可以根据手上资料选择「我知道每月供款」或分期总额的填写方式，并检查期数和首期日期。每期扣款账户是可选的；没有预先选好，也可以在实际记账时选择。',
              '生成明细后，逐期检查金额与日期，尤其是首期和最后一期。实际方案可能有不同的最后一期金额，不能只凭月供乘期数猜测。JSave 的明细用来整理你输入的计划，不会替你向银行或商家支付，也不应把画面上的日期当成银行已经扣款的证明。',
            ],
            list: ['先核对物品价格与首付。', '确认供款期限、首期日期和最后一期金额。', '检查生成的逐期明细，再保存计划。'],
          },
          {
            title: '用一个 RM2,400 的例子看清进度',
            paragraphs: [
              '假设一台笔电价格 RM2,400，没有首付、利息或其他费用，分 12 期，每期 RM200。已经付了 3 期时，已付金额是 RM600，剩下 9 期，共 RM1,800。这个例子把价格、已付与待付分开，因此不会把「每月只需 RM200」误读成整项购买只花了 RM200。',
              '如果计划含首付，先把首付和所有分期金额相加，再与物品价格比较。金额之间有差额时，需要回看方案中是否包含其他收费。马来西亚财政部刊载的 2022 年 BNM 说明也提醒，部分 BNPL 方案即使标示零利息，仍可能有处理费或迟付费用。这里引用的是费用理解背景，并非对现行监管状态的说明。',
            ],
            table: { headers: ['示例项目', '金额或进度'], rows: [['物品价格', 'RM2,400'], ['每月供款', 'RM200 × 12 期'], ['已经付清', '3 期，共 RM600'], ['未来待付', '9 期，共 RM1,800']] },
          },
          {
            title: '从一半开始使用时，确认过去已付期数',
            paragraphs: [
              '不必等下一次购买才开始追踪。若已经供了几个月，可以在计划中填写「过去已付期数」。日期可以帮助推算有多少期已到期，但到期和付清是两件事：有延迟、提早付款或中间暂停时，应按真实付款记录调整，而不是直接接受日期推算的数字。',
              '过去已付期数用于说明进入 JSave 之前的进度，不会自动补造那些月份的历史交易。这样可以保留准确的剩余计划，又不会突然让今天的账本出现几个月以前的付款。如果你已经在 JSave 记过这些支出，应核对它们与计划的对应关系，避免同一段付款既算期初已付又重复计入一笔新支出。',
            ],
          },
          {
            title: '实际付款后，选择记下这期或关联已有',
            paragraphs: [
              '打开物品的「查看分期」，在尚未付款的那一期选择「记下这期」，检查交易金额、日期与付款账户后保存。这条支出会与物品及期数关联，进度因此更新。若那笔付款已经在账本里，例如你刚通过截图快捷指令记过，就选择「关联已有」，找到原来的支出，不需要再次新增。',
              '计划金额与实际支出也可能不同。关联时先检查付款记录是否真的对应这件物品、这一期，而不是仅仅金额相同。若关联错了，可以取消关联后重新选择；解除关系不等于再次付款。保留一个实际付款记录，再用关联说明用途，后续查账会比两条相似支出更清楚。',
            ],
            callout: { title: '一笔付款，保留一条实际支出', body: '已经记过就关联已有；还没记过才新增。计划进度和账本记录才能一起保持清楚。' },
          },
          {
            title: '首付、物品价格与账本支出各有用途',
            paragraphs: [
              '物品价格用于描述购买本身，也用于物品日均成本。填写首付可以帮助计划显示预计支付总额，但它不会代替实际支出记录：首付发生时，仍应另记真实付款。分期计划同样不会因为你填了总额，就自动在当天产生整笔购买金额的支出。',
              '例如上面的无首付示例，在某个月实际只付 RM200，就应检查该月对应的实际付款记录。不要为了让物品价格看起来完整，又把 RM2,400 额外记成一笔现金支出。物品的价值和账户的钱何时流出，是两个观察角度；让各自的数据回答各自的问题，月度报告才容易理解。',
            ],
          },
          {
            title: '每月回看一次，最后核对是否全部结清',
            paragraphs: [
              '完成一次付款后，可以回到物品查看已付期数、未来待扣款和下一期。若同时有多件分期物品，物品页的分期汇总能帮助你看到所有计划中尚未完成的金额。这个总额来自你录入的明细和付款进度；漏记计划或漏关联交易时，它也会不完整。',
              '到最后一期，核对账本记录和实际付款凭证，再确认计划显示结清。介绍页里的模拟付款与庆祝效果只是体验示例，不会修改你的真实账本。你真正需要留下的是清楚的购买资料和付款记录：下一次回看时，能知道为什么付这笔钱，以及这件物品的分期是否已经完成。',
            ],
          },
        ],
        sourcesTitle: '操作入口与费用背景',
        sources: [
          { label: 'JSave：物品分期互动介绍', url: '/zh/#installments', note: '体验计划、已付进度与剩余金额；演示不会保存数据。' },
          { label: '马来西亚财政部：BNM 关于 BNPL 的说明（2022）', url: 'https://www.mof.gov.my/portal/en/news/press-citations/bank-negara-teams-up-with-mof-sc-to-regulate-bnpl-schemes', note: '处理费与迟付费用的背景；本文不据此描述现行监管规定。' },
        ],
      },
      en: {
        category: 'Things and installments',
        title: 'How do you track what is paid and still due on an installment purchase?',
        deck: 'A monthly payment is only one part of the picture. Keep the item price, down payment, schedule and actual payments together so you can distinguish purchase cost, completed installments and the money that has really left your accounts.',
        readingTime: '6 min read',
        imageAlt: 'A laptop and notebook on a sunlit desk, representing an everyday installment purchase',
        takeawaysTitle: 'Separate the plan from the payments',
        takeaways: ['Item price, down payment and installment total are different figures.', 'A due date is not proof of payment; confirm any past-payment count.', 'Link an existing expense when the payment is already in your ledger.', 'Actual spending follows payment transactions, not the entire planned total.'],
        sections: [
          {
            title: 'Start with cost, paid progress and the amount still due',
            paragraphs: [
              '“RM200 a month” is easy to remember when buying a laptop. It does not tell you the purchase price, how long the plan lasts, or whether the earlier payments were actually completed. JSave keeps installment details inside a Thing, giving the purchase and its later payments a shared place to review. The item retains its price and purchase date alongside a schedule of payment amounts and dates.',
              'Before entering the plan, keep the receipt and payment agreement nearby. Use them to confirm the price, down payment, payment count, first due date and monthly amount. The figures in this guide are fictional equal-payment examples, not an offer from a merchant. Your own schedule should reflect the information you actually have rather than a number reconstructed from memory.',
            ],
          },
          {
            title: 'Set up the plan inside the item',
            paragraphs: [
              'Open Goals in JSave, switch to Things, and add or edit the purchase. Fill in its name, cost and purchase date, then enable Installment payments. Choose the entry mode that matches your documents: a known monthly payment or a known installment total. Check the number of payments and first due date. The charge account is optional; you can also select the account when recording a payment.',
              'Review the generated rows before saving, particularly the first and final payments. Some schedules have a different final amount, so multiplying a headline monthly figure by the term may not describe the actual plan. JSave organizes the details you enter. It does not send money to a bank or merchant, and a displayed due date does not mean your bank has already charged the account.',
            ],
            list: ['Check the item price and down payment.', 'Confirm the term, first due date and final payment.', 'Review the individual amounts and dates, then save.'],
          },
          {
            title: 'Read the progress using a RM2,400 example',
            paragraphs: [
              'Imagine a RM2,400 laptop with no down payment, interest or fees, paid over twelve installments of RM200. After three completed payments, RM600 has been paid and nine payments, totaling RM1,800, remain. Keeping these figures separate stops a small monthly amount from obscuring the size and duration of the purchase. It also gives you a straightforward check against the payment records.',
              'When there is a down payment, add it to all scheduled payments before comparing the result with the item price. If the figures differ, check the agreement for additional charges. A 2022 BNM explanation published by Malaysia’s Ministry of Finance notes that some zero-interest BNPL arrangements can still involve processing or late-payment fees. That reference provides fee context here; it is not a description of current regulation.',
            ],
            table: { headers: ['Example', 'Amount or progress'], rows: [['Item price', 'RM2,400'], ['Monthly payment', 'RM200 × 12'], ['Completed', '3 payments, RM600'], ['Still due', '9 payments, RM1,800']] },
          },
          {
            title: 'Confirm past payments when joining midway',
            paragraphs: [
              'You can begin tracking an item you already own. Set Past payments already made to reflect installments completed before you started using JSave. Dates can suggest how many payments have become due, but due and paid are different states. Late, early or paused payments mean you should check actual records rather than automatically accept the date-based count.',
              'The past-payment count establishes opening progress; it does not generate historical expense transactions. That lets you keep a useful remaining schedule without suddenly creating several months of entries. If those payments are already recorded in JSave, review how they relate to the plan. Avoid treating the same payment as opening progress and also recording a new duplicate expense for it.',
            ],
          },
          {
            title: 'Record a payment or link the expense you already have',
            paragraphs: [
              'Open View plan on the item. For an unpaid installment, choose Record, then check the expense amount, payment date and account before saving. The transaction is linked to that item and installment number, which updates progress. If the payment already exists in the ledger, perhaps from the screenshot shortcut, choose Link existing and select that expense instead of adding it again.',
              'An actual charge may differ from the scheduled amount. Check that the selected expense belongs to the right item and installment, not merely that its amount looks familiar. If a link is wrong, unlink it and select the correct record. Changing this relationship is a bookkeeping action, not another payment. One real expense with a clear connection is easier to review than two almost identical entries.',
            ],
            callout: { title: 'One payment, one actual expense', body: 'Link it if already recorded. Add it only if missing. The ledger and payment progress can then tell a consistent story.' },
          },
          {
            title: 'Give the price, down payment and ledger their own jobs',
            paragraphs: [
              'The item price describes the purchase and supports its cost-per-day calculation. A down payment in the plan helps explain the estimated total, but it does not replace the expense that records cash leaving an account. Record the actual down payment separately when it occurs. Likewise, entering an installment total does not automatically create that whole amount as spending on the setup date.',
              'In the no-down-payment example, a month with one actual RM200 payment should have the relevant payment expense. Adding a second RM2,400 expense just to represent the item price would record an extra cash outflow that did not happen in that example. Item value and the timing of payments answer different questions. Keeping them distinct makes the monthly records much easier to interpret.',
            ],
          },
          {
            title: 'Review monthly and reconcile the final installment',
            paragraphs: [
              'After recording a payment, return to the item to review paid progress, future payments and the next due row. When several items have installment plans, the overview helps you see their combined unfinished amounts. Those figures depend on the plans and records you entered. An omitted purchase or a payment that has not been linked will leave the picture incomplete.',
              'At the final installment, compare the ledger with the actual payment evidence before treating the plan as complete. The simulated payments and celebration on the introduction page are a preview and do not change your real records. The lasting benefit is a purchase history you can understand later: what the item cost, why each payment occurred, and whether its recorded installment plan has been completed.',
            ],
          },
        ],
        sourcesTitle: 'Product walkthrough and fee context',
        sources: [
          { label: 'JSave: interactive installment introduction', url: '/en/#installments', note: 'Preview a schedule, paid progress and the remaining amount without saving data.' },
          { label: 'Malaysia Ministry of Finance: BNM on BNPL (2022)', url: 'https://www.mof.gov.my/portal/en/news/press-citations/bank-negara-teams-up-with-mof-sc-to-regulate-bnpl-schemes', note: 'Background on processing and late-payment fees, not a statement of current regulation.' },
        ],
      },
    },
  },
  {
    slug: 'aa-bill-splitting',
    image: '/j-save-everyday.webp',
    publishedAt: '2026-10-02',
    locales: {
      zh: {
        category: 'AA 分账',
        title: '聚餐先付款，怎样只算自己的那份？',
        deck: '帮整桌付款后，银行余额减少的是整张账单，自己的消费却只是其中一份。用 AA 分账保留完整账单、分配每个人的金额，并追踪还款，才不会把代垫误当成全部属于自己的支出。',
        readingTime: '约 6 分钟',
        imageAlt: '咖啡店里的日常记账场景，代表与朋友出门后整理共同消费',
        takeawaysTitle: '代垫金额和个人消费要分开看',
        takeaways: ['账单总额说明你付出了多少钱，自己的份额说明你消费了多少。', '均分适合金额相同的情况，不同时可以自定义份额。', '收到还款后，在原分账记录里更新，并确认到账账户。', '付款和还款各保留一次记录关系，避免额外重复记账。'],
        sections: [
          {
            title: '为什么付了 RM168，自己的支出可能只有 RM42',
            paragraphs: [
              '四个人吃晚餐，总账单 RM168，由你先替大家付款。付款账户确实少了 RM168，但如果约定平均分担，你自己的晚餐支出只是 RM42，另外 RM126 是替三位朋友代垫。若只新增一笔普通 RM168 支出，月底看餐饮分类时就会以为整桌的钱都花在自己身上。',
              'JSave 的 AA 分账把这两个视角放在同一条记录里：总额保留完整付款，自己的份额用于个人支出统计，朋友的份额则保留还款状态。示例金额只是为了说明流程。最重要的是先确认大家怎样分担，再记录，而不是让应用替你决定一顿饭的约定。',
            ],
          },
          {
            title: '建立共同消费的分账记录',
            paragraphs: [
              '在新增交易中选择 AA 分账，填入整张账单的总额、付款账户、类别、日期和备注。加入需要分担的朋友名称，确认人数包含自己。给名字和备注一点背景，例如「周五晚餐」，之后回看会比几条没有来源的转账更容易理解。',
              '先检查总额是否包含大家同意一起分担的服务费或其他金额。某个人额外购买的东西，若没有约定一起承担，就不应只是因为出现在同一张收据而自动均分。JSave 可以整理已确认的份额，但共同消费的分配方式仍需要由参与的人先讲清楚。',
            ],
          },
          {
            title: '什么时候均分，什么时候自定义',
            paragraphs: [
              '大家消费相近、也同意按人数分时，使用均分就很直接。RM168 分成四份，每人 RM42。金额不能整除到分时，应用会分配小额尾差，确保所有人的份额合计仍等于完整账单。不要为了让数字看起来完全一样，遗漏账单上的几分钱。',
              '若每个人消费不同，切换自定义金额，分别填自己的份额和朋友份额。比如 RM168 可以分为你 RM48、Mei RM35、Kai RM45、Aina RM40。保存前确认剩余金额为零。修改账单或人数后，再检查每个人的金额，不要假设旧分配仍然符合新的总额。',
            ],
            table: { headers: ['参与者', '均分示例', '自定义示例'], rows: [['你', 'RM42', 'RM48'], ['Mei', 'RM42', 'RM35'], ['Kai', 'RM42', 'RM45'], ['Aina', 'RM42', 'RM40'], ['合计', 'RM168', 'RM168']] },
          },
          {
            title: '朋友还款后，更新原来的记录',
            paragraphs: [
              'Mei 转回 RM42 后，打开原来的分账记录，把 Mei 标记为已还款，并选择实际到账的账户。Kai 还没转时，继续保留等待状态。这能把朋友、金额和共同账单放在一起，也让你之后能看清谁已经完成自己的份额，而不是再从许多相似转账里猜。',
              '还款可能进到与你当初付款不同的账户。例如晚餐从银行 A 支付，朋友转进银行 B，就按实际情况选择到账账户。标记状态并不会向朋友发送收款请求，也不会代替银行转账；应在确认真实收到金额后更新。应用整理的是你记录的事实。',
            ],
          },
          {
            title: '用余额和支出两个视角检查结果',
            paragraphs: [
              '在均分示例中，付账时付款账户减少 RM168，个人支出统计计入自己的 RM42。若三位朋友都将 RM42 还进同一个账户，该账户收到 RM126，最终净减少 RM42。若还进不同账户，就分别查看各账户的实际变化，而不是只盯着最初付款的余额。',
              '尚未收到的还款不会凭空增加可用余额。等待状态说明还有代垫部分未回来，自己的餐饮份额则仍是 RM42。一个数字回答账户现在有多少钱，另一个回答自己这顿饭花了多少。让它们保留区别，才不会把暂时代垫误当成自己的生活成本。',
            ],
            callout: { title: '余额说明现金流，份额说明个人消费', body: '整张账单、你的份额、朋友的还款状态，三个数字一起看才完整。' },
          },
          {
            title: '最容易出现的重复记账',
            paragraphs: [
              '如果已建立 AA 分账，再把同一张 RM168 收据记成普通支出，就会额外记下一次付款。同样，在分账记录里更新朋友的已还款状态后，又把同一笔回款当成另一笔普通收入，可能让到账金额被重复计算。先决定用原分账关系追踪，再核对是否已经有其他记录。',
              '付款截图导入也需要检查交易类型。导入后的普通支出不等于已经建立 AA 分账；为同一共同账单新增分账前，先确认账本里是否留着原付款记录。目标是一张账单有一套清楚的记录，而不是用更多交易掩盖代垫与个人消费之间的区别。',
            ],
          },
          {
            title: '消费改变后，重新核对分配与还款',
            paragraphs: [
              '发现收据金额抄错、人数遗漏，或有人本来不该承担某一项时，先与实际参与者确认，再编辑分账金额。尤其在部分朋友已经还款后，份额改变会影响你需要核对的记录。不要只让合计等于总额，也要确认每个人的份额与已经收到的钱仍对应得上。',
              '整理完后，用三个问题做最后检查：完整账单是否准确，自己的份额是否准确，已还款的人和到账账户是否准确。需要换设备时，等记录同步完成后再查看；重要账本也可以导出保存。清楚的 AA 分账能减少回忆成本，让月底报告更接近自己的真实消费。',
            ],
          },
        ],
        sourcesTitle: '功能预览与延伸阅读',
        sources: [{ label: 'JSave：产品互动预览', url: '/zh/#product', note: '选择「AA 分账」查看完整账单、自己的份额和朋友还款状态。' }, { label: 'JSave：可靠离线记账', url: '/zh/articles/offline-expense-tracking/', note: '了解记录、同步和多设备查看之间的关系。' }],
      },
      en: {
        category: 'AA bill splitting',
        title: 'How do you count only your share after paying for the table?',
        deck: 'When you pay a shared bill, the entire amount leaves your account but only one share is your personal consumption. Keep the full bill, each person’s allocation and repayments together so an advance for friends does not distort your spending.',
        readingTime: '6 min read',
        imageAlt: 'Everyday expense tracking at a cafe, representing a shared outing with friends',
        takeawaysTitle: 'Separate the advance from your own spending',
        takeaways: ['The bill total records what you paid; your share records what you consumed.', 'Use equal shares when appropriate and custom amounts when they differ.', 'Update repayments in the original split and select the receiving account.', 'Check for duplicate expenses or income entries for the same payment.'],
        sections: [
          {
            title: 'Why paying RM168 can mean spending RM42 yourself',
            paragraphs: [
              'Four people have dinner and you pay the RM168 bill. Your payment account really does lose RM168. If everyone agrees to divide it equally, however, your dinner costs RM42 and the other RM126 is an advance for three friends. Recording the entire amount as an ordinary personal expense would make the dining category look as though you consumed everything yourself.',
              'JSave’s AA split keeps both views in one record. The total retains the full payment, your own share contributes to personal spending, and each friend’s allocation carries a repayment state. These are fictional examples to explain the workflow. Agree on the allocation with the people involved first; an app cannot determine what everyone meant to share.',
            ],
          },
          {
            title: 'Create the shared bill with enough context',
            paragraphs: [
              'Choose AA split when adding a transaction. Enter the complete bill amount, payment account, category, date and a useful note, then add the friends who are sharing it. Check that the headcount includes you. A description such as “Friday dinner” gives future repayments a clear reference, which is more useful than several transfers with no connection to the meal.',
              'Confirm whether the amount includes service charges or other costs everyone agreed to share. A separate purchase by one person does not automatically become a group expense just because it appears on the same receipt. JSave can organize an agreed allocation, while the people involved still decide how the bill should be divided. Start with that agreement rather than reconstructing it at month-end.',
            ],
          },
          {
            title: 'Choose equal shares or enter custom amounts',
            paragraphs: [
              'Equal splitting is straightforward when everyone agrees: RM168 across four people gives RM42 each. When the total cannot be divided evenly to the nearest sen, the app allocates the small remainder so the shares still add up to the complete bill. Do not drop a few sen simply to make every displayed amount identical.',
              'For different purchases, switch to custom amounts and enter your share as well as each friend’s. One RM168 example is RM48 for you, RM35 for Mei, RM45 for Kai and RM40 for Aina. Check that nothing remains unallocated before saving. When the total or headcount changes, review all the amounts again rather than assuming the previous allocation remains correct.',
            ],
            table: { headers: ['Person', 'Equal example', 'Custom example'], rows: [['You', 'RM42', 'RM48'], ['Mei', 'RM42', 'RM35'], ['Kai', 'RM42', 'RM45'], ['Aina', 'RM42', 'RM40'], ['Total', 'RM168', 'RM168']] },
          },
          {
            title: 'Update the original record when a friend pays you back',
            paragraphs: [
              'When Mei returns RM42, open the original split, mark Mei as settled and select the account that actually received the money. Keep Kai pending if his repayment has not arrived. That retains the person, amount and shared bill together, making it easier to understand what is complete without searching through unrelated transfers with similar values.',
              'The repayment can arrive in a different account from the one used for dinner. If bank A funded the bill and Mei transfers into bank B, choose bank B as the receiving account. Updating the state does not request money from a friend or perform a bank transfer. It should follow your confirmation that the real repayment was received; the app is organizing facts you record.',
            ],
          },
          {
            title: 'Check account balances and personal spending separately',
            paragraphs: [
              'In the equal example, the payment account falls by RM168 when you pay, while personal spending includes your RM42 share. If the three friends return RM42 each to that same account, RM126 comes back and its net reduction is RM42. If their repayments go elsewhere, review the real changes in those receiving accounts instead of looking only at the original payment balance.',
              'An outstanding repayment cannot increase available cash before it arrives. The pending state explains the portion of the advance still waiting to return, while your dining share remains RM42. One number answers how much money an account currently holds; another answers what this meal cost you personally. Preserving that distinction makes the records more useful for reviewing everyday consumption.',
            ],
            callout: { title: 'Balances describe cash movement; shares describe consumption', body: 'Review the full bill, your share and repayment states together. Each answers a different part of the story.' },
          },
          {
            title: 'Avoid recording the payment or repayment twice',
            paragraphs: [
              'After creating an AA split, adding the same RM168 receipt as a second ordinary expense records another payment. Likewise, marking a friend as settled and entering the same returned amount as separate ordinary income can count the receipt of money twice. Choose how the original split will track the bill, then check the ledger for other entries representing those same movements.',
              'The screenshot shortcut also needs a transaction-type review. An imported ordinary expense is not automatically an AA split. Before adding a split for that shared bill, check whether its original payment already exists. The goal is one clear set of records for a real bill, rather than extra entries that make the distinction between an advance and personal consumption harder to follow.',
            ],
          },
          {
            title: 'Reconcile changes with the people and payments involved',
            paragraphs: [
              'If the receipt was copied incorrectly, someone was omitted, or a charge should not have been shared, confirm the correction before editing allocations. This matters particularly when some friends have already repaid you. A new set of shares needs to agree with both the real bill and amounts already received. A mathematically correct total alone cannot tell you whether each person’s record is right.',
              'Finish with three checks: is the full bill accurate, is your share accurate, and do the settled people and receiving accounts match actual repayments? Wait for synchronization before relying on another device’s view, and export important records when needed. A clear split reduces the effort of reconstructing an outing and keeps month-end spending closer to what you actually consumed.',
            ],
          },
        ],
        sourcesTitle: 'Product preview and further reading',
        sources: [{ label: 'JSave: interactive product preview', url: '/en/#product', note: 'Choose AA split to inspect the full bill, your share and repayment states.' }, { label: 'JSave: reliable offline expense tracking', url: '/en/articles/offline-expense-tracking/', note: 'Understand how records, synchronization and multiple devices fit together.' }],
      },
    },
  },
  {
    slug: 'iphone-receipt-shortcut',
    image: '/j-save-lifestyle.webp',
    publishedAt: '2026-10-02',
    locales: {
      zh: {
        category: '截图快捷指令',
        title: '一张付款截图，怎样核对后记进 JSave？',
        deck: '付款后留下的一张截图，可以成为记账的起点。准备统一密钥、分享单笔收据、选择账户并核对金额和日期，确认后才保存；已支持的格式自动识别，其他收据可以补全资料。',
        readingTime: '约 6 分钟',
        imageAlt: '手机、笔记本与 JSave 乌龟摆件放在桌上，代表整理付款截图的日常习惯',
        takeawaysTitle: '先核对，再保存',
        takeaways: ['先用一张单笔收据测试，整份账单或交易列表不会批量导入。', '统一密钥保留一次，自己使用的账户先在 JSave 建立。', 'TNG、CIMB 已支持的格式可自动识别；其他格式可能需要补全。', '截图文字由 iPhone 提取，图片本身不会上传到 JSave。'],
        sections: [
          {
            title: '适合从哪一种截图开始',
            paragraphs: [
              '最容易核对的是一张已经完成付款的单笔交易收据，例如 TNG 或 CIMB 的付款结果。金额、日期和来源清楚时，你可以把它作为记录的起点。JSave 的统一 iPhone 快捷指令处理单笔收据，不会把一张交易列表或整份银行账单自动拆成许多交易。',
              '截图看起来像收据，也不代表所有资料都已经准确识别。银行或钱包会更改画面，文字可能不完整，有些截图只显示授权或待处理状态。先确认实际付款是否完成，再检查导入预览。快捷指令减少的是重复输入，而不是取消你对来源、金额和账户的判断。',
            ],
          },
          {
            title: '先准备账户和统一密钥',
            paragraphs: [
              '在 JSave「账户」建立自己使用的银行、钱包或信用卡账户，让导入时有正确的选择。随后打开「设置 → 截图快捷指令下载」，生成并复制统一密钥。新用户无需先给每家银行预设账户关联；账户可以在导入时匹配或选择，确认保存后会记住相关选择。',
              '密钥在设置页只显示一次，应保存在自己控制的位置，不要放进聊天、公开截图或帖子。若已使用旧版 JSave Receipt Import，升级前可以从旧指令第一个「文本」操作复制原密钥。更换指令文件时沿用原密钥与已有账户关系，不需要因为下载更新就随意生成新的凭证。',
            ],
          },
          {
            title: '安装指令，先手动分享一张照片',
            paragraphs: [
              '用 iPhone 打开 JSave 介绍页的快捷指令教程，下载统一指令，在「文件」App 打开并按提示填写密钥。若没有出现设置提问，可以编辑「JSave Receipt Import」，把密钥填入第一个「文本」操作。教程里的五步画面是说明流程的示意，并不是读取你的手机内容。',
              '安装后，在「照片」打开那张单笔收据，点击分享，选择「JSave Receipt Import」。也可以直接打开指令再选照片。Apple 的快捷指令指南说明，指令需要允许显示在共享表单中，才能从其他 App 的分享入口运行；如果找不到它，检查指令的「在共享表单中显示」设置。先完成手动测试，再考虑自动化。',
            ],
            list: ['打开一张单笔付款收据。', '分享给 JSave Receipt Import，或在指令内选照片。', '检查识别结果，不急着确认保存。'],
          },
          {
            title: '自动识别和补全模式有什么区别',
            paragraphs: [
              '统一指令可自动识别已支持的 TNG 和 CIMB 收据格式。遇到陌生收据时，会让你决定是否补全，再检查来源、交易类型、金额、日期和备注。Maybank、Shopee、Grab 等其他画面可以使用补全流程，但不能因此宣称它们的所有格式都已经自动识别。',
              '例如一张收据明确显示 RM13，却缺少可确认的日期，就应该补上真实付款日期，而不是接受一个碰巧出现的数字。若银行来源不明确，按实际 App 选择来源。资料无法确认时先回到原收据或付款记录查看，保留截图，比保存一条看似完整但其实猜出来的交易更有用。',
            ],
          },
          {
            title: '金额以外，账户和交易类型也要核对',
            paragraphs: [
              '保存前依次检查金额、日期、类别、账户和备注。买餐点 RM13 通常是一次消费；从自己的银行充值到自己的 TNG 钱包，则是两个账户之间的转账。看到扣款截图就一律记成支出，会让以后钱包真正消费时再次计算同一笔钱。转账要确认转出与转入两个账户。',
              '选择导入账户时，确认它对应实际付款来源；如果指令记住了旧选择，需要时在预览中更换账户。聚餐代整桌付款还涉及个人份额，普通收据导入不会替你决定 AA 分账。金额只是其中一个字段，其他字段说明这笔钱为什么流动、从哪里流出，以及是否属于自己的消费。',
            ],
            callout: { title: '核对五件事，再确认入账', body: '金额、日期、交易类型、账户、类别。看起来识别成功，仍需要符合真实付款。' },
          },
          {
            title: '确认保存后，检查账本和重复结果',
            paragraphs: [
              '确认资料后才保存，然后回到 JSave 账本，检查记录的金额、日期和账户是否符合原收据。若返回重复结果，先找出原来的交易，不要马上修改几个字段再试一次来绕过重复检查。也要记得自己是否已手动记过；相同付款经过不同方式输入，仍然需要避免在账本里保留两次。',
              '保存成功或发现重复后，可以选择保留或删除本次截图。需要凭证时保留原图，想清理照片时再自行决定。由 iPhone 提取的文字会交给 JSave 处理，截图图片本身不会上传；因此账本记录并不是一份已经上传的收据照片备份。两者用途不同，应按自己的需要保留。',
            ],
          },
          {
            title: '手动流程稳定后，再考虑截图自动化',
            paragraphs: [
              '先确保分享一张照片能顺利完成核对和保存，再按需要到「快捷指令 → 自动化」设置截图后运行统一指令。自动化属于可选步骤，并不是第一次使用就必须完成的安装要求。截图后触发也可能包含其他 App 的画面，所以应观察实际行为是否符合自己的习惯。',
              '普通截图会跳过，疑似收据而资料不完整时会先询问是否补全。不要把这个流程理解成每一张截图都能自动变成准确的账本记录。以后银行更改收据格式、账户换了名字，或快捷指令有更新时，再用一张单笔收据重新测试。保留核对环节，才能让输入更快，同时让结果仍然清楚。',
            ],
          },
        ],
        sourcesTitle: '安装教程与 Apple 操作说明',
        sources: [{ label: 'JSave：统一 iPhone 快捷指令教程', url: '/zh/#shortcut', note: '准备密钥、下载指令、分享收据与核对保存的五步说明。' }, { label: 'Apple：从其他 App 启动快捷指令', url: 'https://support.apple.com/en-au/guide/shortcuts/apd163eb9f95/ios', note: '共享表单与「在共享表单中显示」设置。' }],
      },
      en: {
        category: 'Receipt shortcut',
        title: 'How do you review a payment screenshot before adding it to JSave?',
        deck: 'A payment screenshot can be the starting point for a ledger entry. Prepare a unified key, share one receipt, choose your accounts and review the details before saving. Supported formats are parsed automatically; unfamiliar receipts may need completion.',
        readingTime: '6 min read',
        imageAlt: 'A phone, notebook and JSave turtle on a desk, representing an everyday receipt routine',
        takeawaysTitle: 'Review first, then save',
        takeaways: ['Start with one receipt; transaction lists and whole statements are not imported in bulk.', 'Keep the unified key and create your own accounts in JSave.', 'Supported TNG and CIMB formats are parsed; other formats may need completion.', 'Your iPhone extracts text; the screenshot image itself is not uploaded to JSave.'],
        sections: [
          {
            title: 'Choose a clear single-payment receipt',
            paragraphs: [
              'A completed single-payment receipt is the simplest place to start, such as a TNG or CIMB payment result with a clear amount, date and source. The unified iPhone shortcut handles one receipt. It does not split a screenshot of a transaction list or an entire bank statement into a collection of entries. Use an image you can readily compare with the resulting preview.',
              'Looking like a receipt does not guarantee accurate extraction. Banks and wallets change their screens, text can be incomplete, and some screenshots show an authorization or pending state rather than a completed payment. Confirm what happened, then review the import. The shortcut reduces repeated typing; it does not remove the need to judge the source, amount and account.',
            ],
          },
          {
            title: 'Prepare your accounts and unified key',
            paragraphs: [
              'Create the bank, wallet or credit-card accounts you use in JSave Accounts. Then open Settings → Download screenshot shortcut and generate and copy the unified key. New users do not need to set up a separate bank-to-account link beforehand. Accounts can be matched or selected during import, with confirmed choices remembered after the entry is saved.',
              'The key is shown only once in Settings. Keep it somewhere you control, rather than in a chat, public screenshot or social post. When upgrading an existing JSave Receipt Import, copy the original key from its first Text action before replacing the shortcut. An updated file can use that existing key and account relationships; downloading an update is not a reason to create credentials unnecessarily.',
            ],
          },
          {
            title: 'Install and share a photo manually first',
            paragraphs: [
              'Open the setup guide on your iPhone, download the unified shortcut and open it from Files. Supply the key when prompted. If no setup question appears, edit JSave Receipt Import and put the key in its first Text action. The five illustrated guide steps explain the workflow; they are not screenshots taken from your own phone.',
              'In Photos, open one receipt, tap Share and choose JSave Receipt Import. You can also launch the shortcut and select a photo. Apple explains that a shortcut must be enabled for the share sheet to run from another app’s sharing menu. If it is missing, check Show in Share Sheet in the shortcut settings. Complete a manual test before adding an optional automation.',
            ],
            list: ['Open one completed payment receipt.', 'Share it to JSave Receipt Import or select it inside the shortcut.', 'Inspect the result before confirming an entry.'],
          },
          {
            title: 'Understand parsing and manual completion',
            paragraphs: [
              'The unified shortcut recognizes supported TNG and CIMB receipt formats. For an unfamiliar receipt, you can decide whether to complete the details, then review its source, transaction type, amount, date and note. Maybank, Shopee, Grab and other screens may use that completion flow. This does not mean all their receipt layouts are parsed automatically.',
              'If a receipt clearly shows RM13 but lacks a confirmed date, supply the real payment date rather than accepting a number that merely resembles one. Select the actual bank or app when the source is ambiguous. When information remains uncertain, consult the receipt or payment history first. Keeping the screenshot is more useful than saving a complete-looking entry assembled from guesses.',
            ],
          },
          {
            title: 'Check accounts and transaction type as well as amount',
            paragraphs: [
              'Before saving, review the amount, date, category, account and note. Buying a RM13 meal is consumption; moving money from your own bank into your own TNG wallet is a transfer between accounts. Treating every deduction screenshot as an expense can count a top-up and its later wallet purchase as two separate consumptions. A transfer needs both its source and destination account.',
              'Make sure the chosen account corresponds to the real payment source. If a remembered choice is outdated, change accounts in the preview. Paying for a group meal also involves your personal share, which an ordinary receipt import cannot decide for you. The amount is one field; the other details explain why the money moved, where it moved from, and whether it was your own spending.',
            ],
            callout: { title: 'Check five details before confirming', body: 'Amount, date, transaction type, accounts and category. A recognized receipt still needs to match the real payment.' },
          },
          {
            title: 'Verify the saved record and any duplicate result',
            paragraphs: [
              'Confirm only after reviewing the details, then open the ledger to compare the saved amount, date and account with the receipt. If the shortcut reports a duplicate, find the existing transaction first. Do not change fields merely to get past that result and submit again. Remember any entry you added manually too; different input methods can still represent the same real payment.',
              'After a save or duplicate result, choose whether to retain or delete that screenshot. Keep the original when you need the evidence, or decide to remove it when clearing photos. Extracted text is sent to JSave for processing, but the image itself is not uploaded. The ledger therefore does not provide an uploaded photo backup of that receipt. The record and its original image serve different purposes.',
            ],
          },
          {
            title: 'Add screenshot automation only after the manual flow works',
            paragraphs: [
              'Once sharing a photo reliably reaches review and save, you may add a screenshot-triggered automation in Shortcuts. It is optional, not a required part of the first setup. Screenshots from other apps can trigger it as well, so observe how the flow behaves with the screenshots you normally take. Begin with a working manual process you can easily troubleshoot.',
              'Ordinary screenshots are skipped, while likely receipts with incomplete details ask whether you want to complete them. This should not be understood as a promise that every screenshot becomes an accurate entry automatically. When a bank changes its format, your account setup changes or the shortcut is updated, retest with one receipt. Keeping the review step lets input become faster without losing clarity about the saved result.',
            ],
          },
        ],
        sourcesTitle: 'Setup guide and Apple sharing instructions',
        sources: [{ label: 'JSave: unified iPhone shortcut walkthrough', url: '/en/#shortcut', note: 'Five steps covering the key, installation, sharing and review before saving.' }, { label: 'Apple: launch a shortcut from another app', url: 'https://support.apple.com/en-au/guide/shortcuts/apd163eb9f95/ios', note: 'Share-sheet availability and the Show in Share Sheet setting.' }],
      },
    },
  },
]
