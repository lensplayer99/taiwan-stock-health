// Public, saved research presentation. All values are read from the same published build.
export const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const empty=message=>`<div class="empty">${esc(message)}</div>`;
const num=value=>typeof value==='number'&&Number.isFinite(value)?value.toLocaleString('zh-TW',{maximumFractionDigits:4}):'資料不足';
export const STATES={RED:'紅：正向',GREEN:'綠：負向',GRAY:'灰：條件未達',MISSING:'資料不足'};
export const FACETS={chip:'籌碼',price:'量價',market_relative:'相對大盤',sector_relative:'相對產業族群',risk:'風險提醒'};
export const LAMPS=[
  ...[['trust','投信','chip'],['foreign','外資','chip'],['broker_buy','分點買超集中','chip'],['broker_sell','分點賣超集中','chip'],['volume','量能','price'],['price','股價漲跌','price']].flatMap(([id,name,category])=>[5,10,20].map(window=>({id:`${id}_${window}`,name,category,window}))),
  ...[20,60,120].map(window=>({id:`breakout_${window}`,name:'突破／跌破',category:'price',window})),
  ...[['market_relative','相對大盤','market_relative'],['sector_relative','相對產業族群','sector_relative'],['margin','融資變化','risk']].flatMap(([id,name,category])=>[5,10,20].map(window=>({id:`${id}_${window}`,name,category,window}))),
  ...[['pullback_low_volume','回檔縮量','price'],['rebound_with_volume','反彈量價配合','price'],['volume_weak_close','放量收弱','price'],['rebound_without_volume','反彈無量','price'],['trust_flip','投信由買轉賣','risk'],['foreign_flip','外資由買轉賣','risk'],['broker_flip','前期主要買超分點轉賣','risk'],['overextension','短期過度延伸','risk'],['industry_lag','跑贏大盤但落後族群','risk'],['breakout_failure','突破後放量收回','risk']].map(([id,name,category])=>({id,name,category,window:null}))
];
export const COUNTS={positive_lights:'正向紅燈',negative_lights:'負向綠燈',new_positive_today:'資料日新增紅燈',new_lights_today:'資料日新亮燈',lights_off_today:'資料日熄燈',chip_positive:'籌碼正向',chip_negative:'籌碼負向',price_positive:'量價正向',price_negative:'量價負向',market_relative_positive:'大盤相對正向',market_relative_negative:'大盤相對負向',sector_relative_positive:'族群相對正向',sector_relative_negative:'族群相對負向',risk_count:'風險燈',available_light_count:'可用燈號',missing_lights:'資料不足',transition_unknown_count:'前次比較未知'};
export const RANKING_ORDER=['positive_lights DESC','new_positive_today DESC','negative_lights ASC','stock_id ASC'];
export const RANKING_DISPLAY_LIMIT=50;
export const RANKING_PAGE_SIZE=20;
export function rankingPage(rows,visible=RANKING_PAGE_SIZE,limit=RANKING_DISPLAY_LIMIT){
  const total=Math.min(rows.length,limit),shown=Math.min(total,Math.max(0,Number.isInteger(visible)?visible:RANKING_PAGE_SIZE)),nextShown=Math.min(total,shown+RANKING_PAGE_SIZE);
  return {rows:rows.slice(0,shown),shown,total,nextShown,hasMore:shown<total,moreLabel:`顯示更多（${shown+1}–${nextShown}）`,progressLabel:`目前已顯示 ${shown} / ${total} 名${total<limit?`（保存榜單共 ${total} 名）`:''}`};
}
const lampName=lamp=>`${lamp.name}${lamp.window?` ${lamp.window} 日`:''}`;
const badge=state=>`<span class="signal-badge ${state.toLowerCase()}">${state==='MISSING'?'?':'●'} ${esc(STATES[state])}</span>`;
const validId=id=>typeof id==='string'&&/^[A-Za-z0-9]+$/.test(id);
export const validDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
export function parseRoute(hash=''){
  if(!hash||hash==='#')return {page:'home',id:null,hash:'#home',valid:true};
  if(['#home','#market','#stocks'].includes(hash))return {page:hash.slice(1),id:null,hash,valid:true};
  const match=/^#stock\/([A-Za-z0-9]+)$/.exec(hash);
  return match?{page:'stock',id:match[1],hash,valid:true}:{page:'home',id:null,hash:'#home',valid:false};
}
export function createResourceCache(){
  const cache=new Map();return {get(key,reader){if(!cache.has(key)){const promise=Promise.resolve().then(reader);cache.set(key,promise);promise.catch(()=>{if(cache.get(key)===promise)cache.delete(key);});}return cache.get(key);}};
}
const dataError=()=>Error('這份資料的發布版本或完整性尚未通過核對，暫停顯示。');
const allowedResource=resource=>typeof resource==='string'&&/^(?:public_manifest\.json|data\/(?:market_summary|stock_search_index|stock_signal_summary|stock_ranking)\.json|data\/stocks\/[A-Za-z0-9]+\.json)$/.test(resource);
export function resourceUrl(resource,base){
  if(!allowedResource(resource))throw dataError();
  const directory=new URL('.',base),url=new URL(resource,directory);
  if(url.origin!==directory.origin||!url.pathname.startsWith(directory.pathname)||url.search||url.hash||url.username||url.password)throw dataError();
  return url.href;
}
export function searchStocks(stocks,query,limit=12){const value=String(query||'').trim().toLocaleLowerCase('zh-TW');return value?stocks.filter(stock=>`${stock.stock_id} ${stock.name}`.toLocaleLowerCase('zh-TW').includes(value)).slice(0,limit):[];}
export function validateSignalRow(row,date){
  if(!row||!validId(row.stock_id)||typeof row.name!=='string'||row.date!==date||typeof row.eligible!=='boolean'||row.total_light_count!==40||!row.light_states||Object.keys(row.light_states).length!==40||LAMPS.some(l=>!Object.hasOwn(STATES,row.light_states[l.id]))||Object.keys(COUNTS).some(key=>!Number.isInteger(row[key])||row[key]<0||row[key]>40))throw dataError();
  const states=Object.values(row.light_states);
  if(row.available_light_count+row.missing_lights!==40||states.filter(x=>x==='RED').length!==row.positive_lights||states.filter(x=>x==='GREEN').length!==row.negative_lights||states.filter(x=>x==='MISSING').length!==row.missing_lights||row.new_positive_today>row.positive_lights||row.new_positive_today>row.new_lights_today)throw dataError();
  for(const facet of ['chip','price','market_relative','sector_relative'])for(const [suffix,state] of [['positive','RED'],['negative','GREEN']])if(LAMPS.filter(l=>l.category===facet&&row.light_states[l.id]===state).length!==row[`${facet}_${suffix}`])throw dataError();
  if(LAMPS.filter(l=>l.category==='risk'&&row.light_states[l.id]==='GREEN').length!==row.risk_count)throw dataError();
  return row;
}
export function rowsEqual(a,b){return !!a&&!!b&&['stock_id','name','market','date','eligible','total_light_count',...Object.keys(COUNTS)].every(key=>a[key]===b[key])&&LAMPS.every(l=>a.light_states[l.id]===b.light_states[l.id]);}
export function validateRanking(summary,ranking){
  if(!Array.isArray(summary.stocks)||!Array.isArray(ranking.rows)||ranking.title!=='今日正向紅燈最多'||ranking.display_limit!==RANKING_DISPLAY_LIMIT||ranking.row_count!==ranking.rows.length||JSON.stringify(ranking.order)!==JSON.stringify(RANKING_ORDER))throw dataError();
  const date=summary.signal_as_of||summary.as_of,byStock=new Map();
  for(const row of summary.stocks){validateSignalRow(row,date);if(byStock.has(row.stock_id))throw dataError();byStock.set(row.stock_id,row);}
  const seen=new Set();for(const row of ranking.rows){if(!rowsEqual(row,byStock.get(row?.stock_id))||seen.has(row.stock_id)||!row.eligible||!row.available_light_count)throw dataError();seen.add(row.stock_id);}
  if(summary.stocks.some(row=>row.eligible&&row.available_light_count>0&&!seen.has(row.stock_id)))throw dataError();
  return {byStock,rows:ranking.rows,date};
}
export function filterRows(rows,filter){
  if(!Array.isArray(filter.states)||!Array.isArray(filter.counts)||filter.states.some(c=>!LAMPS.some(l=>l.id===c.id)||!Object.hasOwn(STATES,c.state))||filter.counts.some(c=>!Object.hasOwn(COUNTS,c.field)||[c.min,c.max].some(v=>v!==null&&(!Number.isInteger(v)||v<0||v>40))||(c.min!==null&&c.max!==null&&c.min>c.max)))throw Error('燈數須為 0 至 40，最小值不能大於最大值。');
  return rows.filter(row=>filter.states.every(c=>row.light_states[c.id]===c.state)&&filter.counts.every(c=>(c.min===null||row[c.field]>=c.min)&&(c.max===null||row[c.field]<=c.max)));
}
export function renderFacets(row){return `<div class="facet-counts">${[['chip','籌碼'],['price','量價'],['market_relative','大盤'],['sector_relative','族群']].map(([key,name])=>`<span>${name} <span class="red">正 <b>${row[`${key}_positive`]}</b></span>／<span class="green">負 <b>${row[`${key}_negative`]}</b></span></span>`).join('')}<span>風險 <b class="green">${row.risk_count}</b></span></div>`;}
export function renderRows(rows,ranking=false){
  if(!rows.length)return empty(ranking?'這個資料日沒有可列入榜單的股票。':'沒有同時符合全部條件的股票。');
  return `<div class="table-scroll"><table class="signal-table"><thead><tr>${ranking?'<th>名次</th>':''}<th>股票</th><th>正向紅</th><th>負向綠</th><th>資料日新增紅</th><th>各面向正／負、風險</th><th>可用／全部</th><th>資料日</th></tr></thead><tbody>${rows.map((r,i)=>`<tr>${ranking?`<td class="signal-rank">${i+1}</td>`:''}<td><a class="stock-pick" href="#stock/${esc(r.stock_id)}"><strong>${esc(r.stock_id)}</strong> ${esc(r.name)}</a><span class="muted small">${r.market==='TWSE'?'上市':r.market==='TPEX'?'上櫃':'市場未提供'}</span></td><td><span class="signal-number red">${r.positive_lights}</span></td><td><span class="signal-number green">${r.negative_lights}</span></td><td><strong>${r.new_positive_today}</strong><br><span class="muted small">熄燈 ${r.lights_off_today}</span>${r.transition_unknown_count?`<br><span class="muted small">${r.transition_unknown_count} 顆比較未知</span>`:''}</td><td>${renderFacets(r)}</td><td>${r.available_light_count} / ${r.total_light_count}${r.missing_lights?`<br><span class="muted small">資料不足 ${r.missing_lights}</span>`:''}</td><td>${esc(r.date)}</td></tr>`).join('')}</tbody></table></div>`;
}
export function formatMetric(metric){
  const value=metric.value;if(value===null||value===undefined)return '資料不足';if(typeof value!=='number')return typeof value==='string'||typeof value==='boolean'?String(value):'資料不足';
  if(!Number.isFinite(value))return '資料不足';const percent=['percent','signed_percent','percentage_points','signed_pp'].includes(metric.format),signed=['signed_number','signed_percent','percentage_points','signed_pp'].includes(metric.format);
  return `${signed&&value>0?'+':''}${num(percent?value*100:value)}${['percent','signed_percent'].includes(metric.format)?'%':['percentage_points','signed_pp'].includes(metric.format)?' 個百分點':metric.unit?` ${metric.unit}`:''}`;
}
export const SCHEMAS={manifest:'PUBLIC_RESEARCH_MANIFEST_V1',market:'PUBLIC_MARKET_SUMMARY_V1',search:'PUBLIC_STOCK_SEARCH_V1',summary:'PUBLIC_STOCK_SIGNAL_SUMMARY_V1',ranking:'PUBLIC_STOCK_RANKING_V1',detail:'PUBLIC_STOCK_DETAIL_V1'};
export const VERSION='PUBLIC_RESEARCH_V1';
export const RULE_VERSION='STOCK_SHORT_SIGNAL_V1_20260919';
export const RULE_SHA256='7e3e0d0378375d97eb127b01423a3903c5e13eb3d09fb698d6fd53b47a2a94c2';
export const taipeiDate=(now=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
const fixedResources={market:'data/market_summary.json',search:'data/stock_search_index.json',summary:'data/stock_signal_summary.json',ranking:'data/stock_ranking.json'};
const hashValue=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
export function validateManifest(value,now=new Date()){
  const today=taipeiDate(now);
  if(!Number.isInteger(value?.stock_count)||value.stock_count<0||value.stock_count>20000||!Number.isInteger(value?.ranking_count)||value.ranking_count<0||value.ranking_count>value.stock_count||!Array.isArray(value?.limits)||value.limits.length>40||value.limits.some(note=>typeof note!=='string'||note.length>2000)||value.market_as_of!==value.as_of)throw dataError();
  if(!value||value.schema!==SCHEMAS.manifest||value.version!==VERSION||typeof value.build_id!=='string'||!/^[A-Za-z0-9_-]{1,180}$/.test(value.build_id)||!validDate(value.as_of)||value.as_of>today||!validDate(value.stock_as_of)||!validDate(value.signal_as_of)||value.stock_as_of!==value.as_of||value.signal_as_of!==value.as_of||value.market_as_of!==null&&(!validDate(value.market_as_of)||value.market_as_of>today)||value.rule_version!==RULE_VERSION||value.rule_sha256!==RULE_SHA256||value.display_limit!==RANKING_DISPLAY_LIMIT||!value.files||typeof value.files!=='object'||Array.isArray(value.files))throw dataError();
  for(const [resource,entry] of Object.entries(value.files)){
    if(!['index.html','research.css','research.js'].includes(resource)&&!allowedResource(resource))throw dataError();
    if(resource==='public_manifest.json'||!entry||!hashValue(entry.sha256)||!Number.isInteger(entry.bytes)||entry.bytes<2||entry.bytes>30000000)throw dataError();
  }
  if([...Object.values(fixedResources),'index.html','research.css','research.js'].some(resource=>!Object.hasOwn(value.files,resource)))throw dataError();
  return value;
}
export function validateEnvelope(value,manifest,schema){
  if(!value||value.schema!==schema||['build_id','as_of','version','rule_version','rule_sha256'].some(key=>value[key]!==manifest[key]))throw dataError();
  return value;
}
export async function digestBytes(bytes){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),value=>value.toString(16).padStart(2,'0')).join('');}
export async function verifyResourceBytes(bytes,entry){if(!entry||bytes.byteLength!==entry.bytes||await digestBytes(bytes)!==entry.sha256)throw dataError();return bytes;}
export function createPublicReader(manifest,base,fetcher=fetch){
  validateManifest(manifest);const cache=createResourceCache();
  return (resource,schema)=>cache.get(`${manifest.build_id}:${resource}:${schema}`,async()=>{
    const entry=manifest.files[resource];if(!entry||!Object.values(SCHEMAS).includes(schema))throw dataError();
    const response=await fetcher(resourceUrl(resource,base),{cache:'no-cache'});if(!response.ok)throw Error('這份已發布資料目前無法讀取，其他頁面仍可查看。');
    const bytes=await response.arrayBuffer();await verifyResourceBytes(bytes,entry);
    let body;try{body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw dataError();}
    return validateEnvelope(body,manifest,schema);
  });
}
export function validateSearch(body,manifest){
  if(!Array.isArray(body.stocks)||body.stocks.length!==manifest.stock_count)throw dataError();
  const seen=new Set();for(const row of body.stocks){if(!validId(row?.stock_id)||typeof row.name!=='string'||seen.has(row.stock_id)||!['AVAILABLE','MISSING'].includes(row.signal_status)||row.detail_url!==`./data/stocks/${row.stock_id}.json`||!Object.hasOwn(manifest.files,`data/stocks/${row.stock_id}.json`))throw dataError();seen.add(row.stock_id);}
  return body.stocks;
}
export function validateDetail(body,stock,summary){
  if(body.stock_id!==stock.stock_id||body.name!==stock.name||body.market!==stock.market||!body.signals||!body.observation||!Array.isArray(body.observation.path))throw dataError();
  const signals=body.signals;
  if(signals.status==='MISSING'){
    if(stock.signal_status!=='MISSING'||signals.date!==null||signals.summary!==null||!Array.isArray(signals.lights)||signals.lights.length!==0)throw dataError();return body;
  }
  if(signals.status!=='AVAILABLE'||stock.signal_status!=='AVAILABLE'||!summary||signals.date!==summary.date||!rowsEqual(signals.summary,summary)||!Array.isArray(signals.lights)||signals.lights.length!==40)throw dataError();
  const seen=new Set();for(const lamp of signals.lights){const spec=LAMPS.find(l=>l.id===lamp.id);if(!spec||seen.has(lamp.id)||lamp.category!==spec.category||lamp.window!==spec.window||lamp.state!==summary.light_states[lamp.id]||lamp.date!==signals.date||!Array.isArray(lamp.metrics)||lamp.metrics.some(metric=>typeof metric.label!=='string'||metric.value!==null&&(typeof metric.value!=='number'||!Number.isFinite(metric.value))))throw dataError();seen.add(lamp.id);}
  return body;
}
const lifecycleNames={NO_CAMPAIGN:'尚未進入上漲段',ADVANCING:'上漲階段延續',DAMAGED:'修正中',RECOVERING:'回到前高附近，尚待越峰',ENDED:'本段已結束'};
const statusNames={OBSERVED:'已保存觀察',PREDICTED:'已保存研究估計',NO_CAMPAIGN:'尚未進入適用階段',NO_NEW_ANCHOR:'本次未出現新觀察',NOT_TRIGGERED:'本次未出現新觀察',NOT_APPLICABLE:'目前不適用',WAITING_STOCK_SOURCE:'等待必要資料補齊',WAITING_MARKET_SOURCE:'等待市場資料補齊',HISTORICAL_ONLY:'已保存的歷史資料',MARKET_CLOSED:'非交易時段',WAITING_MARKET_CLOSE:'等待收盤',STALE:'等待新資料',MISSING:'資料不足',OK:'資料已保存',READY:'資料已保存',VALID:'資料已保存',UPDATED:'資料已保存',PARTIAL:'部分資料不足',UNQUALIFIED:'尚未具備研究資格'};
const statusLabel=value=>statusNames[value]||'依保存資料觀察';
const percent=value=>typeof value==='number'&&Number.isFinite(value)?`${value>0?'+':''}${(value*100).toFixed(2)}%`:'資料不足';
export function renderMarket(body,compact=false){
  if(!body||!Array.isArray(body.markets)||!body.markets.length)return empty('大盤摘要目前無法讀取。');
  return body.markets.map(row=>`<article class="card"><div class="card-head"><h3>${row.market==='TAIEX'?'TAIEX 加權報酬指數':row.market==='TPEx'?'TPEx 櫃買市場':esc(row.market)}</h3><span class="pill">${esc(statusLabel(row.status))}</span></div><p class="public-date">資料日 ${esc(row.date||body.market_as_of||'未提供')}</p><div class="market-reading">${num(row.index_level)}</div><div class="facts"><div class="fact"><span>距本段起點</span><strong>${typeof row.gain_from_base_pp==='number'?`${num(row.gain_from_base_pp)} 個百分點`:'資料不足'}</strong></div><div class="fact"><span>距保存高點</span><strong>${percent(row.drawdown_from_peak)}</strong></div></div>${!compact?`<p class="footnote">${row.drawdown_active===true?'保存資料顯示修正仍在觀察中。':row.drawdown_active===false?'保存資料未標示修正進行中。':'修正狀態尚未提供。'}${row.market==='TAIEX'?' 此數值為報酬指數，與一般新聞中的加權股價指數不同。':''}</p>${Array.isArray(row.model_display_names)&&row.model_display_names.length?`<p class="footnote">觀察模型：${row.model_display_names.map(esc).join('、')}</p>`:''}`:''}</article>`).join('');
}
export function renderMarketResearch(body){
  if(!body||!Array.isArray(body.markets))return '';
  return body.markets.map(row=>`<section class="card detail-section public-observation"><h3>${row.market==='TAIEX'?'TAIEX':'TPEx'} 研究範圍與版本</h3><p>${esc(row.covered_scope||'尚未提供可核對研究範圍')}</p><p>${esc(row.unavailable_current_reason||'目前未提供可公開顯示的估計值。')}</p>${Array.isArray(row.model_display_names)&&row.model_display_names.length?`<ul>${row.model_display_names.map(name=>`<li>${esc(name)}</li>`).join('')}</ul>`:'<p>模型顯示名稱尚未提供。</p>'}<p class="footnote">使用中版本：${Array.isArray(row.active_version_names)&&row.active_version_names.length?row.active_version_names.map(esc).join('、'):'尚未提供'}</p></section>`).join('');
}
export function renderObservation(observation){
  const path=observation.path.slice(-60);
  return `<section class="detail-section"><h3>生命週期研究摘要</h3><article class="card"><div class="card-head"><h4>${esc(lifecycleNames[observation.lifecycle_state]||'目前狀態待核對')}</h4><span class="pill">${esc(statusLabel(observation.current_status))}</span></div><p class="public-date">資料日 ${esc(observation.date||'未提供')}</p><div class="facts"><div class="fact"><span>距本段起點</span><strong>${percent(observation.gain_from_base)}</strong></div><div class="fact"><span>距保存高點</span><strong>${percent(observation.drawdown_from_peak)}</strong></div><div class="fact"><span>本段經過</span><strong>${Number.isInteger(observation.campaign_age)?`${observation.campaign_age} 交易日`:'資料不足'}</strong></div><div class="fact"><span>本段啟動日</span><strong class="date-value">${esc(observation.trigger_date||'尚未提供')}</strong></div></div><p class="footnote">${observation.price_window_complete===false?'觀察區間資料不完整。':''}研究估計尚待驗證，保存的狀態不代表未來報酬。</p>${path.length?`<details class="source-details"><summary>已保存的生命週期紀錄（最近 ${path.length} 筆）</summary><div class="table-scroll"><table><thead><tr><th>資料日</th><th>保存價格</th><th>狀態</th><th>距起點</th><th>距高點</th></tr></thead><tbody>${path.map(row=>`<tr><td>${esc(row.date)}</td><td>${num(row.close)}</td><td>${esc(lifecycleNames[row.state]||'狀態待核對')}</td><td>${percent(row.gain_from_base)}</td><td>${percent(row.drawdown_from_peak)}</td></tr>`).join('')}</tbody></table></div></details>`:''}</article></section>`;
}
export function renderStock(body){
  const signals=body.signals,row=signals.summary;
  const observation=renderObservation(body.observation);
  if(signals.status==='MISSING')return `${empty('此股票未列於這個資料日的訊號保存檔，沒有可顯示的燈號。')}${observation}`;
  const header=`<article class="card signal-summary"><div class="card-head"><h3>${esc(body.stock_id)} ${esc(body.name)}</h3><span class="chip">可用 ${row.available_light_count} / 40</span></div><p class="signal-date">資料日 ${esc(signals.date)}；新增與熄燈是這個保存資料日的比較。</p><div class="signal-summary-counts"><span class="red">正向紅 <strong>${row.positive_lights}</strong></span><span class="green">負向綠 <strong>${row.negative_lights}</strong></span><span>資料不足 <strong>${row.missing_lights}</strong></span><span>新增紅 <strong>${row.new_positive_today}</strong></span><span>新亮燈 <strong>${row.new_lights_today}</strong></span><span>熄燈 <strong>${row.lights_off_today}</strong></span></div><p class="footnote">面向摘要（正向／負向）</p>${renderFacets(row)}<p class="footnote">${row.transition_unknown_count} 顆前次比較未知。第一次保存或前次資料不足不計為新增／熄燈；紅燈數量不代表勝率。</p></article>`;
  const lights=Object.entries(FACETS).map(([facet,name])=>`<section class="signal-facet"><h4>${name}</h4><div class="signal-grid">${LAMPS.filter(spec=>spec.category===facet).map(spec=>{const lamp=signals.lights.find(l=>l.id===spec.id);return `<details class="signal-lamp ${lamp.state.toLowerCase()}" data-lamp-id="${esc(lamp.id)}"><summary><span class="signal-lamp-title">${esc(lampName(spec))}</span>${badge(lamp.state)}<span class="signal-reading">${esc(lamp.display_value||STATES[lamp.state])}</span></summary><div class="signal-lamp-body">${lamp.metrics.length?`<dl class="signal-metrics">${lamp.metrics.map(metric=>`<div><dt>${esc(metric.label)}</dt><dd>${esc(formatMetric(metric))}</dd></div>`).join('')}</dl>`:'<p>這顆燈未提供可公開的數值明細。</p>'}<dl class="signal-continuity"><div><dt>保存資料日</dt><dd>${esc(lamp.date)}</dd></div><div><dt>首次可確認亮燈</dt><dd>${esc(lamp.first_lit_date||'尚未觀測到確切起點')}</dd></div><div><dt>至少自此已知亮燈</dt><dd>${esc(lamp.known_since||'尚未建立')}</dd></div><div><dt>連續亮燈</dt><dd>${Number.isInteger(lamp.consecutive_lit_days)?`${lamp.streak_left_censored?'至少 ':''}${lamp.consecutive_lit_days} 個交易日`:'未知'}</dd></div><div><dt>前次狀態</dt><dd>${esc(STATES[lamp.previous_state]||'未知')}</dd></div><div><dt>資料日變化</dt><dd>${lamp.transition_known?`${lamp.new_positive_today?'新增紅燈；':''}${lamp.new_lit_today?'新亮燈；':''}${lamp.extinguished_today?'原燈熄滅；':''}${!lamp.new_lit_today&&!lamp.extinguished_today?'無變化':''}`:'比較未知，不計為新增／熄燈'}</dd></div></dl></div></details>`;}).join('')}</div></section>`).join('');
  return header+lights+observation;
}

function init(){
  const byId=id=>document.getElementById(id);
  let manifest=null,read=null,stocks=[],summary=null,ranking=null,market=null,signal=null,route=parseRoute(location.hash),routeReady=false,selectionGeneration=0,buildReady=false,buildFailed=false;
  let filter={states:[],counts:[]},filterLimit=100;
  let rankingVisible=RANKING_PAGE_SIZE;
  const paintRanking=()=>{
    byId('rankingControls').hidden=!signal;
    if(!signal){byId('rankingRows').innerHTML=empty('榜單與摘要尚未通過同一發布版本核對，暫停顯示排名。');return;}
    const page=rankingPage(signal.rows,rankingVisible);
    byId('rankingRows').innerHTML=renderRows(page.rows,true);byId('rankingProgress').textContent=page.progressLabel;byId('rankingMore').hidden=!page.hasMore;byId('rankingMore').textContent=page.moreLabel;
  };
  const detailCache=createResourceCache(),scrollPositions=new Map();
  const hideSuggestions=()=>{byId('stockSuggestions').hidden=true;byId('stockQuery').setAttribute('aria-expanded','false');};
  const suggestions=()=>{const matches=searchStocks(stocks,byId('stockQuery').value);byId('stockSuggestions').innerHTML=matches.map(stock=>`<a class="stock-pick" href="#stock/${esc(stock.stock_id)}">${esc(stock.stock_id)} ${esc(stock.name)}</a>`).join('');byId('stockSuggestions').hidden=!matches.length;byId('stockQuery').setAttribute('aria-expanded',String(!!matches.length));};
  async function showStock(id){
    const generation=++selectionGeneration,stock=stocks.find(item=>item.stock_id===id);
    byId('stockDetail').innerHTML='';
    if(!buildReady){byId('detailStatus').textContent=buildFailed?'此發布版本尚未通過核對，個股明細暫停顯示。':'正在讀取此發布版本…';return;}
    if(!stock){byId('detailStatus').textContent='查無此股票。請返回個股列表，以代號或名稱搜尋已發布資料。';return;}
    byId('pageHeading').textContent=`${stock.stock_id} ${stock.name}`;document.title=`${stock.stock_id} ${stock.name}｜台股健診雷達`;
    byId('detailStatus').textContent='正在讀取這檔股票的已保存紀錄…';
    try{
      const body=await detailCache.get(`${manifest.build_id}:${id}`,async()=>validateDetail(await read(`data/stocks/${id}.json`,SCHEMAS.detail),stock,signal?.byStock.get(id)));
      if(generation!==selectionGeneration||route.page!=='stock'||route.id!==id)return;
      byId('stockDetail').innerHTML=renderStock(body);byId('detailStatus').textContent=body.signals.status==='AVAILABLE'?`已讀取資料日 ${body.signals.date} 的 40 顆燈號。`:'此股票目前未提供短期訊號，以下顯示已保存研究摘要。';
    }catch(error){if(generation!==selectionGeneration||route.page!=='stock'||route.id!==id)return;byId('detailStatus').textContent=error.message;byId('stockDetail').innerHTML=empty('個股明細暫時無法顯示。可返回列表查看其他股票；此處不會以其他日期資料代替。');}
  }
  function applyRoute({reloadDetail=false}={}){
    const next=parseRoute(location.hash),changed=!routeReady||next.hash!==route.hash;
    if(routeReady&&changed)scrollPositions.set(route.hash,window.scrollY);
    route=next;routeReady=true;
    if(changed&&['home','stocks'].includes(route.page)){rankingVisible=RANKING_PAGE_SIZE;paintRanking();}
    if(location.hash!==route.hash)history.replaceState(null,'',`${location.pathname}${location.search}${route.hash}`);
    const detail=route.page==='stock',isMarket=route.page==='market',tab=detail?'stocks':route.page;
    document.body.dataset.route=route.page;byId('stockListView').hidden=detail||isMarket;byId('marketView').hidden=!isMarket;byId('stockDetailView').hidden=!detail;byId('homeMarketSection').hidden=route.page!=='home';
    for(const link of document.querySelectorAll('[data-route-tab]')){const active=link.dataset.routeTab===tab;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');}
    const title={home:'首頁',market:'大盤觀察',stocks:'個股觀察',stock:`${route.id} 個股觀察`}[route.page];byId('pageHeading').textContent=title;document.title=`${title}｜台股健診雷達`;
    byId('routeStatus').hidden=route.valid;byId('routeStatus').textContent=route.valid?'':'這個頁面連結無法辨識，已返回首頁。';hideSuggestions();
    if(changed||reloadDetail){++selectionGeneration;if(detail)showStock(route.id);}
    if(changed)requestAnimationFrame(()=>{window.scrollTo({top:scrollPositions.get(route.hash)||0,behavior:'instant'});byId('pageHeading').focus({preventScroll:true});});
  }
  function paintFilter(){
    byId('showMore').hidden=true;
    if(!signal){byId('filterResults').innerHTML='';byId('filterStatus').textContent='已發布訊號尚未通過完整性核對，篩選暫停。';return;}
    try{const rows=filterRows(summary.stocks,filter);byId('filterResults').innerHTML=renderRows(rows.slice(0,filterLimit));byId('filterStatus').textContent=`資料日 ${signal.date}：${rows.length} 檔符合，顯示 ${Math.min(rows.length,filterLimit)} 檔，維持保存摘要的原順序。`;byId('showMore').hidden=rows.length<=filterLimit;}
    catch(error){byId('filterStatus').textContent=error.message;byId('filterResults').innerHTML='';}
  }
  function addState(condition={id:'trust_5',state:'RED'}){
    const line=document.createElement('div');line.className='signal-condition';line.innerHTML=`<label>燈號 <select data-filter-id>${LAMPS.map(l=>`<option value="${l.id}"${l.id===condition.id?' selected':''}>${lampName(l)}</option>`).join('')}</select></label><label>狀態 <select data-filter-state>${Object.entries(STATES).map(([value,label])=>`<option value="${value}"${value===condition.state?' selected':''}>${label}</option>`).join('')}</select></label><button type="button" class="secondary" data-remove-condition aria-label="移除此燈號條件">移除</button>`;byId('stateConditions').append(line);
  }
  function addCount(condition={field:'positive_lights',min:null,max:null}){
    const line=document.createElement('div');line.className='signal-condition';line.innerHTML=`<label>燈數 <select data-filter-field>${Object.entries(COUNTS).map(([value,label])=>`<option value="${value}"${value===condition.field?' selected':''}>${label}</option>`).join('')}</select></label><label>至少 <input data-filter-min type="number" min="0" max="40" step="1" placeholder="不限" value="${esc(condition.min??'')}"></label><label>至多 <input data-filter-max type="number" min="0" max="40" step="1" placeholder="不限" value="${esc(condition.max??'')}"></label><button type="button" class="secondary" data-remove-condition aria-label="移除此燈數條件">移除</button>`;byId('countConditions').append(line);
  }
  const presets=[{label:'投信＋買超分點＋量能 5 日紅',states:[{id:'trust_5',state:'RED'},{id:'broker_buy_5',state:'RED'},{id:'volume_5',state:'RED'}],counts:[]},{label:'紅 ≥ 8、綠 ≤ 2',states:[],counts:[{field:'positive_lights',min:8,max:null},{field:'negative_lights',min:null,max:2}]},{label:'資料日新增紅 ≥ 3',states:[],counts:[{field:'new_positive_today',min:3,max:null}]}];
  const setFilter=value=>{filter=structuredClone(value);filterLimit=100;byId('stateConditions').replaceChildren();byId('countConditions').replaceChildren();filter.states.forEach(addState);filter.counts.forEach(addCount);paintFilter();};
  byId('stockSearch').addEventListener('submit',event=>{event.preventDefault();const query=byId('stockQuery').value.trim().toLocaleLowerCase('zh-TW'),exact=stocks.filter(stock=>stock.stock_id.toLocaleLowerCase('zh-TW')===query||stock.name.toLocaleLowerCase('zh-TW')===query),matches=exact.length?exact:searchStocks(stocks,query,Infinity);if(query&&matches.length===1){byId('searchStatus').textContent='';location.hash=`#stock/${matches[0].stock_id}`;}else{byId('searchStatus').textContent=matches.length>1?'有多檔符合，請選擇建議或輸入完整代號。':buildReady?'查無此股票。請嘗試代號、完整或部分名稱。':'搜尋資料尚未載入。';suggestions();}});
  byId('stockQuery').addEventListener('input',()=>{byId('searchStatus').textContent='';suggestions();});byId('stockQuery').addEventListener('keydown',event=>{if(event.key==='Escape')hideSuggestions();});
  byId('rankingMore').addEventListener('click',()=>{if(!signal)return;rankingVisible=rankingPage(signal.rows,rankingVisible).nextShown;paintRanking();});
  byId('addState').addEventListener('click',()=>addState());byId('addCount').addEventListener('click',()=>addCount());
  byId('filterForm').addEventListener('click',event=>{const button=event.target.closest('[data-remove-condition]');if(button)button.closest('.signal-condition').remove();});
  byId('filterForm').addEventListener('submit',event=>{event.preventDefault();filter={states:[...byId('stateConditions').children].map(line=>({id:line.querySelector('[data-filter-id]').value,state:line.querySelector('[data-filter-state]').value})),counts:[...byId('countConditions').children].map(line=>{const min=line.querySelector('[data-filter-min]').value,max=line.querySelector('[data-filter-max]').value;return {field:line.querySelector('[data-filter-field]').value,min:min===''?null:Number(min),max:max===''?null:Number(max)};})};filterLimit=100;paintFilter();});
  byId('clearFilters').addEventListener('click',()=>setFilter({states:[],counts:[]}));byId('showMore').addEventListener('click',()=>{filterLimit+=100;paintFilter();});
  byId('filterPresets').innerHTML=presets.map((preset,i)=>`<button type="button" class="secondary" data-preset="${i}">${preset.label}</button>`).join('');byId('filterPresets').addEventListener('click',event=>{const button=event.target.closest('[data-preset]');if(button)setFilter(presets[Number(button.dataset.preset)]);});
  window.addEventListener('hashchange',()=>applyRoute());applyRoute();
  async function loadBuild(){
    const failures=[];
    try{
      const response=await fetch(resourceUrl('public_manifest.json',location.href),{cache:'no-store'});if(!response.ok)throw Error('公開資料目前無法讀取，請稍後重新整理頁面。');manifest=validateManifest(await response.json());read=createPublicReader(manifest,location.href);
      const time=manifest.publication_requested_at_utc;
      byId('publicationMeta').innerHTML=`<span class="chip">個股／訊號資料日 <strong>${esc(manifest.as_of)}</strong></span><span class="chip">大盤資料日 <strong>${esc(manifest.market_as_of||'未提供')}</strong></span><span class="chip">可查詢 <strong>${manifest.stock_count} 檔</strong></span>${time?`<span class="chip">此發布版本時間（開始發布） <strong>${esc(new Date(time).toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false}))}（台北）</strong></span>`:''}`;
      byId('publicationFooter').textContent=`燈號規則 ${manifest.rule_version} · 研究資料版本 ${manifest.version} · 發布批次 ${manifest.build_id}${manifest.generated_at_utc?` · 快照建立時間 ${manifest.generated_at_utc}`:''}`;
      byId('researchSummary').innerHTML=`<div class="public-observation"><p>這裡呈現已保存的生命週期與訊號研究。燈號數量不代表預測機率，單一資料日也不能證明未來表現。</p><ul>${(Array.isArray(manifest.limits)?manifest.limits:[]).map(note=>`<li>${esc(note)}</li>`).join('')}</ul></div>`;
      const results=await Promise.allSettled(Object.entries(fixedResources).map(async([kind,resource])=>({kind,body:await read(resource,SCHEMAS[kind])})));
      for(let i=0;i<results.length;i++){const result=results[i],kind=Object.keys(fixedResources)[i];if(result.status==='rejected'){failures.push(kind);continue;}try{const body=result.value.body;if(kind==='market'){if(!Array.isArray(body.markets))throw dataError();market=body;}if(kind==='search')stocks=validateSearch(body,manifest);if(kind==='summary')summary=body;if(kind==='ranking')ranking=body;}catch{failures.push(kind);}}
      if(summary&&ranking){try{signal=validateRanking(summary,ranking);if(ranking.row_count!==manifest.ranking_count)throw dataError();}catch{signal=null;failures.push('ranking');}}
      byId('homeMarketSummary').innerHTML=renderMarket(market,true);byId('marketCards').innerHTML=renderMarket(market);byId('marketResearch').innerHTML=renderMarketResearch(market);byId('marketDate').textContent=market?`大盤資料日 ${market.market_as_of||manifest.market_as_of}。市場狀態：${statusLabel(market.session_status)}。`:'大盤摘要目前無法讀取。';byId('marketNotes').textContent='以上僅描述已保存的市場狀態；不同市場的資料日可能不同。觀察資料尚待驗證，指數與個股訊號不能換算為投資勝率。';
      paintRanking();
      byId('rankingDate').textContent=signal?`資料日 ${signal.date}，顯示完整保存排名的前 ${Math.min(signal.rows.length,RANKING_DISPLAY_LIMIT)} 名（分段顯示）；新增／熄燈皆是該資料日的比較，不表示今天發出新訊號。`:'排名資料目前無法讀取。';
      byId('loadStatus').textContent=failures.length?'部分已發布資料目前無法核對，受影響區塊暫停顯示；其餘區塊保持同一發布版本。':'已讀取同一發布版本的保存資料；切換頁面不會重新計算研究結果。';byId('loadStatus').classList.toggle('error',failures.length>0);
      buildReady=true;paintFilter();applyRoute({reloadDetail:true});
    }catch(error){buildFailed=true;byId('loadStatus').textContent=error.message;byId('loadStatus').classList.add('error');byId('rankingRows').innerHTML=empty('公開保存資料尚未就緒。');byId('homeMarketSummary').innerHTML=empty('大盤摘要尚未就緒。');byId('marketCards').innerHTML=empty('大盤摘要尚未就緒。');byId('detailStatus').textContent='此發布版本尚未通過核對，個股明細暫停顯示。';paintFilter();}
  }
  loadBuild();
}
if(typeof document!=='undefined')init();
