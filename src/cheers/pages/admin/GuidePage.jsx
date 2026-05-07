import React, { useState, useEffect } from 'react'

const IMG_BASE = '/admin-guide'

function Shot({ name, caption }) {
  const [exists, setExists] = useState(null) // null | true | false
  useEffect(() => {
    let cancelled = false
    fetch(`${IMG_BASE}/${name}`, { method: 'HEAD' })
      .then(r => {
        const ct = r.headers.get('content-type') || ''
        if (!cancelled) setExists(r.ok && ct.startsWith('image/'))
      })
      .catch(() => { if (!cancelled) setExists(false) })
    return () => { cancelled = true }
  }, [name])

  if (exists === false) {
    return (
      <div className="my-4 border-2 border-dashed border-cheers-brown/30 rounded-lg p-6 bg-cheers-cream/30 text-center">
        <p className="text-xs text-cheers-brown/50 mb-1">📷 待补截图</p>
        <code className="text-[11px] text-cheers-brown/70">{IMG_BASE}/{name}</code>
        {caption && <p className="text-xs text-cheers-brown/60 mt-2">{caption}</p>}
      </div>
    )
  }
  if (exists === null) {
    return <div className="my-4 h-32 border border-dashed border-cheers-brown/10 rounded-lg bg-cheers-cream/10" />
  }
  return (
    <figure className="my-4">
      <img
        src={`${IMG_BASE}/${name}`}
        alt={caption || ''}
        loading="lazy"
        className="w-full rounded-lg border border-cheers-cream shadow-sm"
      />
      {caption && <figcaption className="text-xs text-cheers-brown/60 text-center mt-1.5">{caption}</figcaption>}
    </figure>
  )
}

function Section({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-24 mb-12">
      <h2 className="font-serif text-2xl text-cheers-dark-brown mb-3 pb-2 border-b border-cheers-cream">{title}</h2>
      <div className="prose prose-sm max-w-none text-cheers-dark-brown/80 leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  )
}

function Sub({ id, title, children }) {
  return (
    <div id={id} className="scroll-mt-24 mt-6">
      <h3 className="font-serif text-lg text-cheers-brown mt-4 mb-2">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Step({ n, children }) {
  return (
    <div className="flex gap-3 my-2">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cheers-brown text-cheers-cream text-xs font-bold flex items-center justify-center">{n}</span>
      <div className="flex-1 pt-0.5">{children}</div>
    </div>
  )
}

function Tip({ children }) {
  return (
    <div className="my-3 px-4 py-2.5 bg-amber-50 border-l-4 border-amber-300 text-sm text-amber-900 rounded-r">
      💡 {children}
    </div>
  )
}

function Warn({ children }) {
  return (
    <div className="my-3 px-4 py-2.5 bg-red-50 border-l-4 border-red-300 text-sm text-red-900 rounded-r">
      ⚠️ {children}
    </div>
  )
}

const TOC = [
  { id: 'intro', title: '新手入门', sub: [
    { id: 'intro-customer-flow', title: '顾客购物完整流程' },
    { id: 'intro-admin-overview', title: '后台界面总览' },
  ]},
  { id: 'scenarios', title: '日常运营场景', sub: [
    { id: 's-new-trip', title: 'A. 开启新一轮代购' },
    { id: 's-order-flow', title: 'B. 处理一笔订单（完整流程）' },
    { id: 's-product', title: 'C. 上架商品（图片 / 规格 / 描述）' },
    { id: 's-coupon', title: 'D. 发优惠券' },
    { id: 's-refund', title: 'E. 处理退款 / 取消' },
    { id: 's-purchase', title: 'F. 批量采购（用 Report）' },
    { id: 's-delivery', title: 'G. 批量发货（按地区分组）' },
    { id: 's-manual-order', title: 'H. 手动创建订单' },
    { id: 's-add-admin', title: 'I. 添加管理员' },
  ]},
  { id: 'pages', title: '各页面参考', sub: [
    { id: 'p-dashboard', title: '仪表盘' },
    { id: 'p-trips', title: '行程管理' },
    { id: 'p-products', title: '商品管理' },
    { id: 'p-categories', title: '分类管理' },
    { id: 'p-orders', title: '订单管理' },
    { id: 'p-create-order', title: '手动创建订单' },
    { id: 'p-coupons', title: '优惠券' },
    { id: 'p-report', title: '报表' },
    { id: 'p-admins', title: '管理员' },
    { id: 'p-settings-payment', title: '设置：付款' },
    { id: 'p-settings-delivery', title: '设置：配送' },
    { id: 'p-settings-contact', title: '设置：联系方式' },
    { id: 'p-settings-policies', title: '设置：条款' },
    { id: 'p-settings-activity', title: '设置：动态 Feed' },
    { id: 'p-settings-home', title: '设置：主页' },
    { id: 'p-settings-fonts', title: '设置：字体' },
  ]},
  { id: 'faq', title: '常见问题', sub: [] },
]

export default function GuidePage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-cheers-dark-brown">Cheers.co 后台使用指南</h1>
        <p className="text-cheers-brown/60 text-sm mt-1">给家人和小伙伴看的图文操作手册</p>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-8">
        {/* TOC */}
        <aside className="lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
          <nav className="text-sm space-y-1 bg-white rounded-lg border border-cheers-cream p-3">
            {TOC.map(group => (
              <div key={group.id} className="mb-2">
                <a href={`#${group.id}`} className="block font-medium text-cheers-dark-brown hover:text-cheers-brown py-1">{group.title}</a>
                {group.sub.length > 0 && (
                  <div className="ml-2 border-l border-cheers-cream pl-2 mt-0.5">
                    {group.sub.map(s => (
                      <a key={s.id} href={`#${s.id}`} className="block text-cheers-brown/70 hover:text-cheers-brown py-0.5 text-xs">
                        {s.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <article>
          {/* ========== 新手入门 ========== */}
          <Section id="intro" title="新手入门">
            <p>欢迎来帮忙打理 Cheers.co！这份指南会带你了解后台的所有功能，按顺序看一遍大约 20 分钟，之后只需要在不熟悉某个操作时回来翻一下。</p>

            <Sub id="intro-customer-flow" title="顾客购物完整流程">
              <p>先了解顾客是怎么用我们的网站，这样后台数据从哪来你就清楚了。</p>

              <Step n={1}>顾客打开网站首页（HomePage），看到当前活跃的代购行程、活动公告、首页分类。</Step>
              <Shot name="customer-01-home.png" caption="首页 — 顾客第一眼看到的内容（行程、公告、首页分类）" />

              <Step n={2}>点击「浏览商品」进入商品列表，可以按分类筛选。</Step>
              <Shot name="customer-02-products.png" caption="商品列表 — 含搜索、行程切换、子分类筛选" />

              <Step n={3}>点击商品进入详情页，选择尺码 / 颜色，加入购物车。</Step>
              <Shot name="customer-03-detail.png" caption="商品详情 — 多图轮播、规格选择、描述" />

              <Step n={4}>顾客在购物车结账，填收货信息，选择面交或邮寄，可输入优惠码，下单。下单后跳转到付款页（PaymentPage）显示二维码。</Step>
              <Shot name="customer-04-cart-checkout.png" caption="购物车 → 结账 → 付款" />

              <p className="mt-3">顾客付款后会通过 WhatsApp / Telegram 发付款截图给我们 → 我们后台确认 → 状态更新 → 顾客在「我的订单」页可以追踪进度。</p>
            </Sub>

            <Sub id="intro-admin-overview" title="后台界面总览">
              <p>后台 URL 是 <code className="bg-cheers-cream/40 px-1 rounded">/admin</code>，登录后会看到：</p>

              <Shot name="overview-dashboard.png" caption="后台首页 — 左侧菜单 + 右侧内容区" />

              <p><strong>左侧菜单分两组：</strong></p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                <li><strong>业务运营</strong>：仪表盘、行程、商品、分类、订单、管理员、优惠券、报表</li>
                <li><strong>设置</strong>：付款、配送、联系方式、条款、动态 Feed、主页、字体</li>
              </ul>
              <Tip>电脑浏览体验最好；手机也能用，左上角有汉堡菜单。</Tip>
            </Sub>
          </Section>

          {/* ========== 日常运营场景 ========== */}
          <Section id="scenarios" title="日常运营场景">
            <p>下面是最常做的几件事，按步骤跟着做就行。</p>

            <Sub id="s-new-trip" title="场景 A：开启新一轮代购">
              <p>每次出发去日本（或其他国家）代购前，你需要：</p>

              <Step n={1}>进「行程管理」 → 点「新增行程」 → 填国家中英名称、旗帜、开始/截单日期 → 保存</Step>
              <Shot name="trips-edit.png" caption="新增 / 编辑行程表单" />

              <Step n={2}>把这个新行程「设为活跃」（点行程列表里那个按钮）。系统只会展示活跃行程的商品给顾客。</Step>

              <Step n={3}>进「商品管理」上架本次代购的商品（详见场景 C）。商品里要选对应的「行程」字段。</Step>

              <Step n={4}>进「主页设置」 → 公告横幅 → 加一条「日本代购接单中，截单日 X 月 X 日」之类的提示。</Step>
              <Shot name="settings-home-banner.png" caption="主页公告横幅设置" />

              <Step n={5}>到顾客视角的首页 <code>/</code> 检查一下：行程显示对了吗？公告显示对了吗？</Step>

              <Tip>截单日到了之后，把行程状态改成「已截单」，新顾客就不能继续下单了，但已下单的订单可以继续处理。</Tip>
            </Sub>

            <Sub id="s-order-flow" title="场景 B：处理一笔订单（完整流程）">
              <p>订单状态共 8 个，一笔正常订单会经过：</p>

              <div className="my-4 p-5 bg-cheers-cream/30 rounded-lg overflow-x-auto">
                <div className="flex items-center gap-2 min-w-max text-sm">
                  {[
                    { label: '待确认', color: 'bg-amber-100 text-amber-900 border-amber-300' },
                    { label: '已接单', color: 'bg-blue-100 text-blue-900 border-blue-300' },
                    { label: '采购中', color: 'bg-indigo-100 text-indigo-900 border-indigo-300' },
                    { label: '已采购', color: 'bg-purple-100 text-purple-900 border-purple-300' },
                    { label: '已发货', color: 'bg-cyan-100 text-cyan-900 border-cyan-300' },
                    { label: '已完成', color: 'bg-green-100 text-green-900 border-green-300' },
                  ].map((s, i, arr) => (
                    <React.Fragment key={s.label}>
                      <span className={`px-3 py-1.5 rounded-lg border font-medium ${s.color}`}>{s.label}</span>
                      {i < arr.length - 1 && <span className="text-cheers-brown/40">→</span>}
                    </React.Fragment>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-cheers-brown/10 flex items-center gap-2 text-xs text-cheers-brown/60">
                  <span>异常情况：</span>
                  <span className="px-2 py-0.5 rounded bg-red-100 text-red-900 border border-red-300">已取消</span>
                  <span>/</span>
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-900 border border-rose-300">退款退货</span>
                </div>
              </div>

              <Sub id="" title="① 待确认（顾客刚下单）">
                <p>顾客付款后会给我们发付款截图。我们核对后：</p>
                <Step n={1}>进「订单管理」 → 找到订单 → 点击展开</Step>
                <Step n={2}>核对：商品、金额、收货信息是否正确</Step>
                <Step n={3}>顾客已付款 → 把状态改为「已接单」</Step>
                <Shot name="order-expanded.png" caption="订单展开详情视图" />
              </Sub>

              <Sub id="" title="② 已接单 → 采购中">
                <p>到日本后开始买东西时，把订单批量改为「采购中」。也可以用「报表 → 采购汇总」按商品聚合，逐个买并填「已购数量」，系统会自动升级订单状态。</p>
              </Sub>

              <Sub id="" title="③ 已采购 → 已发货">
                <p>东西全买齐回到马来西亚，准备打包寄出：</p>
                <Step n={1}>进「报表 → 配送分组」按地址分组打包</Step>
                <Step n={2}>把每组订单批量改为「已发货」</Step>
                <Step n={3}>用每个订单的 WhatsApp 按钮通知顾客（自动生成订单摘要 + 配送信息）</Step>
              </Sub>

              <Sub id="" title="④ 已完成">
                <p>顾客确认收到 → 状态改为「已完成」。这一笔订单结束。</p>
              </Sub>

              <Warn>不要随意倒退订单状态。如果顾客反映问题，先在订单里加备注，再决定是否改状态或开退款。</Warn>
            </Sub>

            <Sub id="s-product" title="场景 C：上架商品">
              <p>进「商品管理 → 新增商品」：</p>

              <Step n={1}><strong>上传图片（最多 8 张）</strong>：第一张是主图，会显示在商品列表。可以拖拽排序。</Step>
              <Shot name="product-edit-images.png" caption="商品图片上传区" />

              <Step n={2}><strong>填基础信息</strong>：中英名称、价格（RM）、行程（选当前活跃行程）、分类（可多选）。</Step>
              <Shot name="product-edit-basic.png" caption="商品基础信息" />

              <Step n={3}><strong>规格设置（可选）</strong>：
                <ul className="list-disc list-inside ml-4 text-sm mt-1">
                  <li>尺码：S/M/L 或自定义。顾客必须选才能下单。</li>
                  <li>颜色：每个颜色可关联一张图片，顾客点选时主图自动切换。</li>
                </ul>
              </Step>
              <Shot name="product-edit-variants.png" caption="尺码 / 颜色配置" />

              <Step n={4}><strong>富文本描述（可选）</strong>：除了简短中英描述，还可以加内容块（文字 / 图片 / YouTube 视频）。</Step>
              <Shot name="product-edit-blocks.png" caption="富文本内容块" />

              <Step n={5}><strong>勾选项</strong>：
                <ul className="list-disc list-inside ml-4 text-sm mt-1">
                  <li><strong>有库存</strong>：顾客才能下单。截单后取消勾选。</li>
                  <li><strong>精选</strong>：会出现在首页「精选商品」区。</li>
                </ul>
              </Step>

              <Step n={6}>保存。</Step>
            </Sub>

            <Sub id="s-coupon" title="场景 D：发优惠券">
              <p>有两种发法，看你想给谁：</p>

              <Sub id="" title="① 个人优惠券（针对特定顾客）">
                <p>用于：感谢老顾客、生日福利、客诉补偿。</p>
                <Step n={1}>「优惠券 → 个人优惠券」 → 搜索顾客邮箱 → 选中</Step>
                <Step n={2}>设置类型（百分比 / 固定金额 / 免运费）、最低消费、过期时间</Step>
                <Step n={3}>发送。顾客在「我的账号」可以看到。</Step>
                <Shot name="coupons-personal.png" caption="个人优惠券面板" />
              </Sub>

              <Sub id="" title="② 优惠码（公开活动）">
                <p>用于：节日促销、社交媒体引流。所有人输入优惠码都能用，可限制总使用次数。</p>
                <Shot name="coupons-codes.png" caption="优惠码管理面板" />
              </Sub>

              <Tip>个人优惠券适合「针对性发」，优惠码适合「广撒网」。</Tip>
            </Sub>

            <Sub id="s-refund" title="场景 E：处理退款 / 取消">
              <Step n={1}>在订单管理找到订单 → 改状态为「退款」或「已取消」</Step>
              <Step n={2}>在订单备注里写明原因（如：商品缺货、顾客要求退款）</Step>
              <Step n={3}>用 WhatsApp 联系顾客确认退款方式（DuitNow 等）</Step>
              <Warn>退款需要财务确认后才操作。状态改完不代表钱退出去了，记得跟进。</Warn>
            </Sub>

            <Sub id="s-purchase" title="场景 F：批量采购（用 Report）">
              <p>到日本店家后，最高效的做法不是一笔笔订单看，而是按商品汇总。</p>

              <Step n={1}>进「报表 → 采购汇总」 → 看到的是「商品 X 总共要买 Y 件，分布在 Z 个订单」</Step>
              <Shot name="report-purchase.png" caption="按商品聚合的采购清单" />

              <Step n={2}>点「复制采购清单」→ 粘贴到 Notes 或 WhatsApp 给在日本的人</Step>

              <Step n={3}>买回来后在「已购数量」输入实际买到的数 → 系统自动升级相关订单状态为「已采购」</Step>

              <Tip>如果有商品没买齐（缺货），输入实际买到的数量。系统会保持订单为「采购中」状态，提示后续处理。</Tip>
            </Sub>

            <Sub id="s-delivery" title="场景 G：批量发货">
              <Step n={1}>进「报表 → 配送分组」 → 系统按州/邮区分组</Step>
              <Shot name="report-delivery.png" caption="配送分组视图" />

              <Step n={2}>点「复制本组地址」 → 粘贴到运单系统</Step>

              <Step n={3}>整组改状态为「已发货」 → 用每单的 WhatsApp 按钮通知顾客</Step>
            </Sub>

            <Sub id="s-manual-order" title="场景 H：手动创建订单">
              <p>用于：朋友通过电话/微信下单、补单、加单。</p>
              <Shot name="create-order.png" caption="手动创建订单表单" />
              <Step n={1}>「订单管理 → 新增订单」</Step>
              <Step n={2}>填顾客信息（如果是已有客户的「加单」，可以勾选关联到他原有订单 → 自动填地址 + 免运费）</Step>
              <Step n={3}>逐项添加商品（手填名称、尺码、单价、数量）</Step>
              <Step n={4}>选配送方式 → 保存。订单会进入「待确认」状态。</Step>
            </Sub>

            <Sub id="s-add-admin" title="场景 I：添加管理员">
              <p>有两种方式：</p>
              <ul className="list-disc list-inside ml-2 text-sm space-y-1">
                <li><strong>邮箱搜索</strong>：对方已经在网站注册过 → 输入邮箱搜索 → 加为管理员</li>
                <li><strong>UID 添加</strong>：对方还没注册 → 让他先注册 → 在 Firebase Console 复制他的 UID → 在这里粘贴</li>
              </ul>
              <Shot name="admins.png" caption="管理员管理面板" />
              <Warn>主管理员（也就是网站老板）不可以被移除。</Warn>
            </Sub>
          </Section>

          {/* ========== 各页面参考 ========== */}
          <Section id="pages" title="各页面参考">
            <p>这部分是「按页面」的参考手册，遇到不熟悉的按钮可以来这里查。</p>

            <Sub id="p-dashboard" title="仪表盘 (Dashboard)">
              <Shot name="dashboard.png" />
              <p>进入后台后第一眼看到的页面。三张卡片：订单总数 / 待确认数 / 商品总数。下方是最近 10 单订单速览。</p>
            </Sub>

            <Sub id="p-trips" title="行程管理">
              <Shot name="trips-list.png" />
              <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                <li>所有行程列表，可以新增 / 编辑 / 删除</li>
                <li>每个行程含国家中英名、旗帜、开始/截单日期、状态</li>
                <li>「设为活跃」按钮 — 同时只能有 1 个活跃行程</li>
              </ul>
            </Sub>

            <Sub id="p-products" title="商品管理">
              <Shot name="products-list.png" />
              <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                <li>所有商品列表，可按分类筛选</li>
                <li>每行：图、名称、价格、分类、库存、精选标记</li>
                <li>勾选多个商品 → 底部出现批量操作工具条（改库存 / 精选）</li>
              </ul>
              <Shot name="products-batch.png" caption="批量操作工具条" />
            </Sub>

            <Sub id="p-categories" title="分类管理">
              <Shot name="categories-tree.png" />
              <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                <li>支持二级分类（父 / 子）</li>
                <li>拖拽排序（同级之间）</li>
                <li>可上传分类封面图（首页分类卡片用）</li>
              </ul>
            </Sub>

            <Sub id="p-orders" title="订单管理">
              <Shot name="orders-list.png" />
              <p><strong>筛选维度</strong>：搜索（订单号 / 顾客名 / 邮箱）、付款状态、订单状态</p>
              <p><strong>每行可以</strong>：</p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                <li>展开看完整订单</li>
                <li>快速改状态（按钮）</li>
                <li>WhatsApp 通知顾客（自动生成模板）</li>
              </ul>
            </Sub>

            <Sub id="p-create-order" title="手动创建订单">
              <p>见场景 H。</p>
            </Sub>

            <Sub id="p-coupons" title="优惠券">
              <p>三个 Tab：</p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                <li><strong>个人优惠券</strong>：发给特定顾客</li>
                <li><strong>优惠码</strong>：公开输入码</li>
                <li><strong>推荐设置</strong>：顾客差几块达到优惠门槛时，推荐哪些分类的商品（出现在结账页）</li>
              </ul>
              <Shot name="coupons-recommend.png" caption="推荐设置 — 结账页 upsell 配置" />
            </Sub>

            <Sub id="p-report" title="报表">
              <p>三个 Tab：</p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                <li><strong>采购汇总</strong>：按商品看要买什么、买了多少</li>
                <li><strong>配送分组</strong>：按地址分组打包</li>
                <li><strong>收入概览</strong>：已完成总收入、进行中订单金额、状态分布柱状图</li>
              </ul>
              <Shot name="report-revenue.png" caption="收入概览" />
            </Sub>

            <Sub id="p-admins" title="管理员">
              <p>见场景 I。</p>
            </Sub>

            <Sub id="p-settings-payment" title="设置：付款">
              <Shot name="settings-payment.png" />
              <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                <li><strong>付款模式</strong>：全款 或 定金</li>
                <li><strong>定金金额</strong>：定金模式下可设固定金额（留空 = 订单总额）</li>
                <li><strong>付款二维码</strong>：上传后顾客付款页会显示</li>
                <li><strong>付款说明</strong>：中英双语，会显示在付款页</li>
              </ul>
            </Sub>

            <Sub id="p-settings-delivery" title="设置：配送">
              <Shot name="settings-delivery.png" />
              <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                <li>西马 / 东马邮费</li>
                <li>是否允许面交</li>
                <li>面交地点列表</li>
              </ul>
            </Sub>

            <Sub id="p-settings-contact" title="设置：联系方式">
              <Shot name="settings-contact.png" />
              <p>WhatsApp 号码、Telegram 链接、新订单邮件通知设置。</p>
            </Sub>

            <Sub id="p-settings-policies" title="设置：条款">
              <Shot name="settings-policies.png" />
              <p>三个文档：使用条款 / 隐私政策 / 退款政策，每个都中英双语。Footer 链接到这些页面。</p>
            </Sub>

            <Sub id="p-settings-activity" title="设置：动态 Feed">
              <Shot name="settings-activity.png" />
              <p>开关控制：是否在网站左下角显示「XX 刚刚购买了 YY」之类的虚拟动态弹窗，营造热度感。</p>
              <Tip>关闭后立即生效（顾客需要刷新页面）。</Tip>
            </Sub>

            <Sub id="p-settings-home" title="设置：主页">
              <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                <li><strong>主标题区</strong>：图标 / 主标题 / 副标题 / 按钮文案（中英）</li>
                <li><strong>公告横幅</strong>：可加多条，自动轮播，可选颜色</li>
                <li><strong>社交媒体</strong>：IG / FB / TikTok / YouTube / 小红书等链接（Footer 显示）</li>
                <li><strong>首页分类</strong>：勾选哪些分类要在首页以卡片形式展示</li>
              </ul>
              <Shot name="settings-home-hero.png" caption="主标题区配置" />
              <Shot name="settings-home-social.png" caption="社交媒体" />
              <Shot name="settings-home-categories.png" caption="首页分类卡片" />
            </Sub>

            <Sub id="p-settings-fonts" title="设置：字体">
              <Shot name="settings-fonts.png" />
              <p>选英文字体 + 中文字体的搭配。提供「优雅 / 现代 / 温暖」等快速搭配，也可单独选择。改完会有实时预览。</p>
            </Sub>
          </Section>

          {/* ========== FAQ ========== */}
          <Section id="faq" title="常见问题">
            <div className="space-y-4">
              <div>
                <p className="font-medium text-cheers-dark-brown">Q：顾客付款后多久要确认订单？</p>
                <p className="text-sm">建议 24 小时内。我们核对到付款截图就改状态为「已接单」。</p>
              </div>

              <div>
                <p className="font-medium text-cheers-dark-brown">Q：订单状态可以倒退吗？</p>
                <p className="text-sm">技术上可以（点状态按钮选回去），但不建议。倒退会让顾客看到状态跳回去，造成困惑。如果是误改，先备注说明再改。</p>
              </div>

              <div>
                <p className="font-medium text-cheers-dark-brown">Q：「优惠券」和「优惠码」有什么区别？</p>
                <p className="text-sm"><strong>优惠券</strong> 是绑定到特定顾客账号的，自动出现在他「我的账号」里。<strong>优惠码</strong> 是任何人都可以输入的（适合公开促销，可限总使用次数）。</p>
              </div>

              <div>
                <p className="font-medium text-cheers-dark-brown">Q：商品改了价格，已下单的订单会变吗？</p>
                <p className="text-sm">不会。订单生成时会保存当时的价格快照。</p>
              </div>

              <div>
                <p className="font-medium text-cheers-dark-brown">Q：行程截单了，已下单的订单还能继续处理吗？</p>
                <p className="text-sm">能。截单只是阻止新顾客下单，不影响已下单的处理流程。</p>
              </div>

              <div>
                <p className="font-medium text-cheers-dark-brown">Q：怎么知道某个商品有多少人下单了？</p>
                <p className="text-sm">进「报表 → 采购汇总」，按商品聚合显示总需要数量。</p>
              </div>

              <div>
                <p className="font-medium text-cheers-dark-brown">Q：关闭活动 Feed 后顾客马上看不到了吗？</p>
                <p className="text-sm">需要刷新页面。已经打开网站的顾客要等他下次刷新或重新进网站。</p>
              </div>

              <div>
                <p className="font-medium text-cheers-dark-brown">Q：误删了商品 / 订单怎么办？</p>
                <p className="text-sm">联系老板。Firebase 数据库可以从最近的备份恢复，但有一定时间窗口。</p>
              </div>
            </div>
          </Section>

          <div className="mt-12 pt-6 border-t border-cheers-cream text-center text-xs text-cheers-brown/40">
            <p>有问题随时问我们。这份指南会随着系统更新而更新。</p>
          </div>
        </article>
      </div>
    </div>
  )
}
