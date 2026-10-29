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
export const NET_RANKING_VERSION='NET_LIGHTS_V1_20260920';
export const NET_RANKING_ORDER=['net_lights DESC','positive_lights DESC','new_positive_today DESC','data_completeness DESC','stock_id ASC'];
export const signedNetLights=value=>Number.isInteger(value)?`${value>0?'+':''}${value}`:'—';
export const RANKING_DISPLAY_LIMIT=50;
export const RANKING_PAGE_SIZE=20;
export function rankingPage(rows,visible=RANKING_PAGE_SIZE,limit=RANKING_DISPLAY_LIMIT){
  const total=Math.min(rows.length,limit),shown=Math.min(total,Math.max(0,Number.isInteger(visible)?visible:RANKING_PAGE_SIZE)),nextShown=Math.min(total,shown+RANKING_PAGE_SIZE);
  return {rows:rows.slice(0,shown),shown,total,nextShown,hasMore:shown<total,moreLabel:`顯示更多（${shown+1}–${nextShown}）`,progressLabel:`目前已顯示 ${shown} / ${total} 名${total<limit?`（保存榜單共 ${total} 名）`:''}`};
}
export const RANKING_MARKETS={TWSE:'上市',TPEX:'上櫃'};
export function marketRankingPage(rows,market,visible=RANKING_PAGE_SIZE){
  if(!Object.hasOwn(RANKING_MARKETS,market))throw Error('榜單市場無效。');
  const savedMarketRows=rows.filter(row=>row.market===market),page=rankingPage(savedMarketRows,visible),unknownCount=rows.filter(row=>!Object.hasOwn(RANKING_MARKETS,row.market)).length;
  return {...page,market,marketRowCount:savedMarketRows.length,unknownCount,progressLabel:`${RANKING_MARKETS[market]}：${page.progressLabel}`,scopeLabel:`依保存的市場分類，各自從完整排名取前 50 名，維持保存順序。${unknownCount?`另有 ${unknownCount} 檔市場分類未提供，未列入任一榜。`:'未提供市場分類者不列入任一榜。'}`};
}
const lampName=lamp=>`${lamp.name}${lamp.window?` ${lamp.window} 日`:''}`;
const badge=state=>`<span class="signal-badge ${state.toLowerCase()}">${state==='MISSING'?'?':'●'} ${esc(STATES[state])}</span>`;
const validId=id=>typeof id==='string'&&/^[A-Za-z0-9]+$/.test(id);
export const validDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
export function parseRoute(hash=''){
  if(!hash||hash==='#')return {page:'market',id:null,hash:'#market',valid:true};
  if(['#home','#market','#stocks','#predictions','#composite','#sectors'].includes(hash))return {page:hash.slice(1),id:null,hash,valid:true};
  const match=/^#stock\/([A-Za-z0-9]+)$/.exec(hash);
  return match?{page:'stock',id:match[1],hash,valid:true}:{page:'home',id:null,hash:'#home',valid:false};
}
export function createResourceCache(){
  const cache=new Map();return {get(key,reader){if(!cache.has(key)){const promise=Promise.resolve().then(reader);cache.set(key,promise);promise.catch(()=>{if(cache.get(key)===promise)cache.delete(key);});}return cache.get(key);}};
}
const dataError=()=>Error('這份資料的發布版本或完整性尚未通過核對，暫停顯示。');
const allowedResource=resource=>typeof resource==='string'&&/^(?:public_manifest\.json|data\/(?:market_margin|market_summary|stock_search_index|stock_signal_summary|stock_ranking)\.json|data\/stocks\/[A-Za-z0-9]+\.json)$/.test(resource);
export function resourceUrl(resource,base){
  if(!allowedResource(resource))throw dataError();
  const directory=new URL('.',base),url=new URL(resource,directory);
  if(url.origin!==directory.origin||!url.pathname.startsWith(directory.pathname)||url.search||url.hash||url.username||url.password)throw dataError();
  return url.href;
}
export function searchStocks(stocks,query,limit=12){const value=String(query||'').trim().toLocaleLowerCase('zh-TW');return value?stocks.filter(stock=>`${stock.stock_id} ${stock.name}`.toLocaleLowerCase('zh-TW').includes(value)).sort((a,b)=>Number(b.stock_id.toLowerCase()===value)-Number(a.stock_id.toLowerCase()===value)||stockCodeOrder(a,b)).slice(0,limit):[];}
export function validateSignalRow(row,date){
  if(!row||!validId(row.stock_id)||typeof row.name!=='string'||row.date!==date||typeof row.eligible!=='boolean'||row.total_light_count!==40||!row.light_states||Object.keys(row.light_states).length!==40||LAMPS.some(l=>!Object.hasOwn(STATES,row.light_states[l.id]))||Object.keys(COUNTS).some(key=>!Number.isInteger(row[key])||row[key]<0||row[key]>40))throw dataError();
  const states=Object.values(row.light_states);
  if(row.available_light_count+row.missing_lights!==40||states.filter(x=>x==='RED').length!==row.positive_lights||states.filter(x=>x==='GREEN').length!==row.negative_lights||states.filter(x=>x==='MISSING').length!==row.missing_lights||row.new_positive_today>row.positive_lights||row.new_positive_today>row.new_lights_today)throw dataError();
  for(const facet of ['chip','price','market_relative','sector_relative'])for(const [suffix,state] of [['positive','RED'],['negative','GREEN']])if(LAMPS.filter(l=>l.category===facet&&row.light_states[l.id]===state).length!==row[`${facet}_${suffix}`])throw dataError();
  if(LAMPS.filter(l=>l.category==='risk'&&row.light_states[l.id]==='GREEN').length!==row.risk_count)throw dataError();
  return row;
}
export function rowsEqual(a,b){return !!a&&!!b&&['stock_id','name','market','date','eligible','total_light_count',...Object.keys(COUNTS)].every(key=>a[key]===b[key])&&LAMPS.every(l=>a.light_states[l.id]===b.light_states[l.id]);}
export function validateSignalSummary(summary){
  if(!summary||summary.schema!==SCHEMAS.summary||summary.total_light_count!==40||!Array.isArray(summary.stocks))throw dataError();
  const date=summary.signal_as_of||summary.as_of,byStock=new Map();
  for(const row of summary.stocks){validateSignalRow(row,date);if(byStock.has(row.stock_id))throw dataError();byStock.set(row.stock_id,row);}
  return {byStock,date};
}
const sameSavedValue=(a,b)=>a===b||!!a&&!!b&&typeof a==='object'&&typeof b==='object'&&Object.keys(a).length===Object.keys(b).length&&Object.keys(a).every(key=>Object.hasOwn(b,key)&&sameSavedValue(a[key],b[key]));
const netRowMatchesSummary=(row,saved)=>!!row&&!!saved&&Object.keys(row).length===Object.keys(saved).length+3&&Object.keys(saved).every(key=>sameSavedValue(row[key],saved[key]));
export function savedNetOrderIsValid(previous,row){
  for(const key of ['net_lights','positive_lights','new_positive_today'])if(previous[key]!==row[key])return previous[key]>row[key];
  const previousRatio=previous.available_light_count*row.total_light_count,rowRatio=row.available_light_count*previous.total_light_count;
  if(previousRatio!==rowRatio)return previousRatio>rowRatio;
  return previous.stock_id<row.stock_id;
}
export function validateRanking(summary,ranking){
  const signal=validateSignalSummary(summary);
  if(!ranking||ranking.schema!==SCHEMAS.ranking||ranking.ranking_version!==NET_RANKING_VERSION||['build_id','as_of','version','rule_version','rule_sha256'].some(key=>ranking[key]!==summary[key])||!Array.isArray(ranking.rows)||ranking.title!=='淨紅燈排行'||ranking.display_limit!==RANKING_DISPLAY_LIMIT||ranking.row_count!==ranking.rows.length||JSON.stringify(ranking.order)!==JSON.stringify(NET_RANKING_ORDER))throw dataError();
  const counts={TWSE:0,TPEX:0,unknown:0},seen=new Set();let previous=null;
  for(const row of summary.stocks)if(row.eligible&&row.available_light_count>0)counts[Object.hasOwn(RANKING_MARKETS,row.market)?row.market:'unknown']++;
  if(!ranking.market_counts||Object.keys(ranking.market_counts).length!==3||Object.keys(counts).some(key=>ranking.market_counts[key]!==counts[key]))throw dataError();
  for(const row of ranking.rows){const saved=signal.byStock.get(row?.stock_id);if(!netRowMatchesSummary(row,saved)||seen.has(row.stock_id)||!saved.eligible||saved.available_light_count===0||!Object.hasOwn(RANKING_MARKETS,row.market)||!Number.isInteger(row.net_lights)||row.net_lights!==saved.positive_lights-saved.negative_lights||!Number.isFinite(row.data_completeness)||row.data_completeness!==saved.available_light_count/saved.total_light_count)throw dataError();
    if(previous&&previous.market==='TPEX'&&row.market==='TWSE'||!Number.isInteger(row.market_rank)||row.market_rank!==(previous?.market===row.market?previous.market_rank+1:1)||previous?.market===row.market&&!savedNetOrderIsValid(previous,row))throw dataError();seen.add(row.stock_id);previous=row;
  }
  if(ranking.rows.length!==counts.TWSE+counts.TPEX||summary.stocks.some(row=>row.eligible&&row.available_light_count>0&&Object.hasOwn(RANKING_MARKETS,row.market)&&!seen.has(row.stock_id)))throw dataError();
  return {...signal,rows:ranking.rows,market_counts:ranking.market_counts};
}
export function filterRows(rows,filter){
  if(!Array.isArray(filter.states)||!Array.isArray(filter.counts)||filter.states.some(c=>!LAMPS.some(l=>l.id===c.id)||!Object.hasOwn(STATES,c.state))||filter.counts.some(c=>!Object.hasOwn(COUNTS,c.field)||[c.min,c.max].some(v=>v!==null&&(!Number.isInteger(v)||v<0||v>40))||(c.min!==null&&c.max!==null&&c.min>c.max)))throw Error('燈數須為 0 至 40，最小值不能大於最大值。');
  return rows.filter(row=>filter.states.every(c=>row.light_states[c.id]===c.state)&&filter.counts.every(c=>(c.min===null||row[c.field]>=c.min)&&(c.max===null||row[c.field]<=c.max)));
}
export function renderFacets(row){return `<div class="facet-counts">${[['chip','籌碼'],['price','量價'],['market_relative','大盤'],['sector_relative','族群']].map(([key,name])=>`<span>${name} <span class="red">正 <b>${row[`${key}_positive`]}</b></span>／<span class="green">負 <b>${row[`${key}_negative`]}</b></span></span>`).join('')}<span>風險 <b class="green">${row.risk_count}</b></span></div>`;}
export function renderRows(rows,ranking=false){
  if(!rows.length)return empty(ranking?'這個資料日沒有可列入榜單的股票。':'沒有同時符合全部條件的股票。');
  return `<div class="table-scroll"><table class="signal-table"><thead><tr>${ranking?'<th>名次</th>':''}<th>股票</th>${ranking?'<th>淨紅燈</th>':''}<th>正向紅</th><th>負向綠</th><th>資料日新增紅</th><th>各面向正／負、風險</th><th>可用／全部</th><th>資料日</th></tr></thead><tbody>${rows.map((r,i)=>`<tr>${ranking?`<td class="signal-rank">${r.market_rank}</td>`:''}<td><a class="stock-pick" href="#stock/${esc(r.stock_id)}"><strong>${esc(r.stock_id)}</strong> ${esc(r.name)}</a><span class="muted small">${r.market==='TWSE'?'上市':r.market==='TPEX'?'上櫃':'市場未提供'}</span></td>${ranking?`<td><strong data-signal-count="net_lights" data-net-lights="${esc(r.net_lights)}" class="signal-net ${r.net_lights>0?'red':r.net_lights<0?'green':'gray'}">${esc(signedNetLights(r.net_lights))}</strong></td>`:''}<td><span class="signal-number red">${r.positive_lights}</span></td><td><span class="signal-number green">${r.negative_lights}</span></td><td><strong>${r.new_positive_today}</strong><br><span class="muted small">熄燈 ${r.lights_off_today}</span>${r.transition_unknown_count?`<br><span class="muted small">${r.transition_unknown_count} 顆比較未知</span>`:''}</td><td>${renderFacets(r)}</td><td>${r.available_light_count} / ${r.total_light_count}${r.missing_lights?`<br><span class="muted small">資料不足 ${r.missing_lights}</span>`:''}</td><td>${esc(r.date)}</td></tr>`).join('')}</tbody></table></div>`;
}
export function formatMetric(metric){
  const value=metric.value;if(value===null||value===undefined)return '資料不足';if(typeof value!=='number')return typeof value==='string'||typeof value==='boolean'?String(value):'資料不足';
  if(!Number.isFinite(value))return '資料不足';const percent=['percent','signed_percent','percentage_points','signed_pp'].includes(metric.format),signed=['signed_number','signed_percent','percentage_points','signed_pp'].includes(metric.format);
  return `${signed&&value>0?'+':''}${num(percent?value*100:value)}${['percent','signed_percent'].includes(metric.format)?'%':['percentage_points','signed_pp'].includes(metric.format)?' 個百分點':metric.unit?` ${metric.unit}`:''}`;
}
export const SCHEMAS={manifest:'PUBLIC_RESEARCH_MANIFEST_V1',margin:'PUBLIC_MARKET_MARGIN_V1',market:'PUBLIC_MARKET_SUMMARY_V2',search:'PUBLIC_STOCK_SEARCH_V1',summary:'PUBLIC_STOCK_SIGNAL_SUMMARY_V1',ranking:'PUBLIC_STOCK_RANKING_V2',detail:'PUBLIC_STOCK_DETAIL_V1'};
export const VERSION='PUBLIC_RESEARCH_V1';
export const RULE_VERSION='STOCK_SHORT_SIGNAL_V1_20260919';
export const RULE_SHA256='7e3e0d0378375d97eb127b01423a3903c5e13eb3d09fb698d6fd53b47a2a94c2';
export const taipeiDate=(now=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
const fixedResources={margin:'data/market_margin.json',market:'data/market_summary.json',search:'data/stock_search_index.json',summary:'data/stock_signal_summary.json',ranking:'data/stock_ranking.json'};
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
const indexNames={TAIEX:'加權指數',TPEx:'櫃買指數'};
const point=value=>typeof value==='number'&&Number.isFinite(value)?value.toLocaleString('zh-TW',{minimumFractionDigits:2,maximumFractionDigits:2}):'資料不足';
const signedPoint=value=>typeof value==='number'&&Number.isFinite(value)?`${value>0?'+':''}${point(value)}`:'資料不足';
const researchStates={accumulating_local_peak:'上升段延續',major_local_correction:'修正觀察中',local_drawdown_candidate:'局部回撤觀察中'};
const modelCondition=m=>`${m.side==='M'?'修正段':'上升段'}・${m.cohort==='FIRST_TOUCH'?'首次觸及':m.side==='M'?(m.direction==='RISING'?'回撤加深':'回撤減少'):(m.direction==='RISING'?'漲幅向上穿越':'漲幅向下穿越')}・${m.horizon}交易日・${m.lens==='FULL_HISTORY'?'完整歷史':'原 EX_2008'}`;
const forecastMode=m=>m.mode==='PROSPECTIVE'&&m.prospective_eligible?'事前保存':m.mode==='POST_CUTOFF_REPLAY'?'事後補算':'未發出估計';
const probabilityText=value=>typeof value==='number'&&Number.isFinite(value)?`${(value*100).toFixed(2)}%`:'資料不足';

export function validateMarket(body,now=new Date()){
  if(body?.schema!=='PUBLIC_MARKET_SUMMARY_V2'||!Array.isArray(body.markets)||body.markets.length!==2||new Set(body.markets.map(r=>r.market)).size!==2)throw dataError();
  const today=taipeiDate(now);
  for(const row of body.markets){
    const q=row.quote,r=row.research;
    if(!Object.hasOwn(indexNames,row.market)||q?.market!==row.market||q?.kind!=='PRICE_INDEX'||q?.session!=='CLOSE'||r?.basis!=='TOTAL_RETURN_INDEX'||r.as_of!==body.market_as_of)throw dataError();
    if(q.status==='MISSING'){if(q.close!==null||q.date!==null||q.change_points!==null||q.change_ratio!==null)throw dataError();}
    else if(!['AVAILABLE','SAVED_CLOSE'].includes(q.status)||!validDate(q.date)||q.date>today||!Number.isFinite(q.close)||q.close<=0)throw dataError();
    if(q.change_ratio!==null&&(!Number.isFinite(q.change_ratio)||!Number.isFinite(q.previous_close)||q.previous_close<=0||!validDate(q.previous_date)||q.previous_date>=q.date||Math.abs(q.close/q.previous_close-1-q.change_ratio)>1e-10||Math.abs(q.close-q.previous_close-q.change_points)>0.011))throw dataError();
    if(!Array.isArray(row.models)||!Array.isArray(row.history))throw dataError();
    for(const m of [...row.models,...row.history]){
      if(m.market!==row.market||![20,60].includes(m.horizon)||m.target!==`H${m.horizon}_POSITIVE_GIVEN_NONFLAT`||!hashValue(m.model_hash))throw dataError();
      if(m.display_estimates){
        if(!validDate(m.anchor_date)||m.anchor_date>r.as_of||!validDate(m.feature_source_date)||m.feature_source_date>m.anchor_date||!['PROSPECTIVE','POST_CUTOFF_REPLAY'].includes(m.mode)||m.mode==='PROSPECTIVE'&&!m.prospective_eligible)throw dataError();
        for(const k of m.estimators)if(!Number.isFinite(m.raw?.[k])||m.raw[k]<0||m.raw[k]>1)throw dataError();
        if(m.price_feature_source_date!==null&&(!validDate(m.price_feature_source_date)||m.price_feature_source_date>m.anchor_date))throw dataError();
        if(m.mode==='PROSPECTIVE'){
          const times=[m.issued_at,m.temporal_issued_at,m.next_target_session_open,m.model_frozen_at,m.activation_at,m.source_acquired_at_max].map(x=>x?Date.parse(x):NaN);
          const [issued,bound,next,frozen,activation,acquired]=times;
          const local=new Date(issued+8*3600000);
          if(!times.every(Number.isFinite)||issued!==bound||issued>=next||frozen>issued||activation>issued||acquired>issued||taipeiDate(new Date(issued))!==m.anchor_date||local.getUTCHours()*60+local.getUTCMinutes()<810)throw dataError();
        }
      }else if(Object.values(m.raw).some(x=>x!==null))throw dataError();
    }
  }
  return body;
}

export function renderMarket(body,compact=false){
  if(!body)return empty('大盤摘要目前無法讀取。');
  validateMarket(body);
  return body.markets.map(row=>{
    const q=row.quote,r=row.research;
    const quoteDate=q.date?`${esc(q.date)} 收盤`:'收盤資料待補';
    const delta=q.change_ratio===null?'前一交易日資料不足':`${signedPoint(q.change_points)} 點（${percent(q.change_ratio)}）`;
    return `<article class="card market-v2-card"><div class="card-head"><h3>${esc(indexNames[row.market])}</h3><span class="pill">價格指數</span></div><p class="public-date">${quoteDate} · 非即時行情</p><div class="market-reading" data-quote-market="${esc(row.market)}">${point(q.close)}<span class="market-unit"> 點</span></div><p class="quote-change">${delta}</p><p class="footnote">來源：${esc(q.source)}；${q.previous_date?`比較 ${esc(q.previous_date)} 收盤。`:esc(q.reason)}</p><div class="research-position"><div class="card-head"><h4>研究位置與回撤</h4><span class="pill">${esc(researchStates[r.status]||'已保存狀態')}</span></div><p class="footnote">研究資料日 ${esc(r.as_of)} · 以下採含股利總報酬指數</p><div class="facts"><div class="fact"><span>自本段起點漲幅</span><strong>${point(r.gain_from_base_pp)}%</strong></div><div class="fact"><span>距本段保存高點</span><strong>${percent(r.drawdown_ratio)}</strong></div></div>${!compact?`<p class="footnote">研究起點 ${esc(r.base_date||'未提供')}；總報酬指數 ${point(r.base_level)} → ${point(r.index_level)}；本段高點 ${point(r.peak_level)}。</p><p class="footnote">${r.drawdown_active?'修正仍在觀察中。':'未標示修正進行中。'}這是既有路徑位置，不能當作下跌機率。</p>`:''}</div></article>`;
  }).join('');
}

function forecastRow(m,historical=false){
  const show=m.display_estimates;
  const estimate=k=>!m.estimators.includes(k)?'未使用':show?probabilityText(m.raw[k]):'—';
  const cal=m.calibrated_estimators.length?m.calibrated_estimators.map(k=>`${k} ${show?probabilityText(m.calibrated[k]):'—'}`).join('；'):'尚無校準版本';
  const dates=m.market==='TAIEX'?`價格／路徑截至 ${esc(m.price_feature_source_date||'未提供')} 收盤<br>前一同市場觀測日 ${esc(m.feature_source_date||'未提供')}`:`路徑觀測日 ${esc(m.anchor_date||'未觸發')}<br>融資與前觀測控制資料日 ${esc(m.feature_source_date||'未提供')}<br>價格來源日 ${esc(m.price_feature_source_date||'原紀錄未另列')}`;
  const support=`訓練 ${m.training_rows??'未提供'} 列／${m.training_groups??'未提供'} 群組；最後標籤日 ${esc(m.training_label_end||'未提供')}<br>校準／有限前推來源 ${m.calibration_rows??'未提供'} 列／${m.calibration_groups??'未提供'} 群組；不是獨立前瞻驗證。`;
  return `<tr data-model="${esc(m.candidate_id)}"><td>${esc(modelCondition(m))}<small>${esc(m.candidate_id)}</small></td><td>${esc(m.anchor_date||m.as_of)}<small>${historical?'過去紀錄':show?'資料日新估計':'資料日未觸發'} · ${esc(forecastMode(m))}</small></td><td>${estimate('B0')}</td><td>${estimate('B1')}</td><td>${estimate('B2')}</td><td>${esc(cal)}</td><td>${historical?`${esc(m.status)} · ${m.elapsed_trading_days??'—'}/${m.horizon}日`:esc(m.reason)}<details><summary>版本、資料日與樣本</summary><p>${dates}<br>發出時間 ${esc(m.issued_at||'未發出')}<br>凍結時間 ${esc(m.model_frozen_at||'原紀錄未另列')}<br>模型 ${esc(m.model_version)}<br>${support}<br>${esc(m.evidence_note)}</p></details></td></tr>`;
}

export function renderMarketResearch(body){
  if(!body)return '';
  validateMarket(body);
  const table=rows=>`<div class="table-scroll"><table class="market-model-table"><thead><tr><th>條件與期限</th><th>觀測日／紀錄</th><th>B0 加權歷史頻率（基準）</th><th>B1 價格與路徑估計</th><th>B2 加入融資估計</th><th>校準後研究估計</th><th>狀態與依據</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  return `<section class="card detail-section"><h3>已保存的大盤條件估計</h3><p>資料日 ${esc(body.market_as_of)}。下表估計完整 20／60 個同市場交易觀測日後的正總報酬機率，分母只含完整期限且期末非持平的結果；不是明日漲跌或崩盤機率。B0 是同條件的加權歷史頻率；B1／B2 是已凍結模型的條件估計，不相加為 100%。紀錄數不是獨立驗證樣本數；不同期限、鏡頭及相近觀測日可能相關。</p><p class="notice">${body.research_counts.predictions} 筆已保存紀錄：事前 ${body.research_counts.prospective}、事後補算 ${body.research_counts.replay}；${body.research_counts.pending} 筆尚未到期、${body.research_counts.matured} 筆已到期。預測效力尚待驗證。加權 B1 在有限歷史比較未優於 B0，校準支持不足。</p>${body.markets.map(row=>`<section class="market-estimates"><h4>${esc(indexNames[row.market])} · ${esc(row.research.as_of)} 的條件狀態</h4>${table(row.models.map(m=>forecastRow(m)).join(''))}<details class="forecast-history"><summary>已保存的歷史預測（${row.history.length} 筆）</summary><p class="footnote">原日期與原估計保留。歷史預測不是今日新訊號；方向表示當時的穿越方向，不是未來漲跌預測。</p>${table(row.history.map(m=>forecastRow(m,true)).join(''))}</details></section>`).join('')}</section>`;
}

export function renderObservation(observation){
  const path=observation.path.slice(-60);
  return `<section class="detail-section"><h3>生命週期研究摘要</h3><article class="card"><div class="card-head"><h4>${esc(lifecycleNames[observation.lifecycle_state]||'目前狀態待核對')}</h4><span class="pill">${esc(statusLabel(observation.current_status))}</span></div><p class="public-date">資料日 ${esc(observation.date||'未提供')}</p><div class="facts"><div class="fact"><span>距本段起點</span><strong>${percent(observation.gain_from_base)}</strong></div><div class="fact"><span>距保存高點</span><strong>${percent(observation.drawdown_from_peak)}</strong></div><div class="fact"><span>本段經過</span><strong>${Number.isInteger(observation.campaign_age)?`${observation.campaign_age} 交易日`:'資料不足'}</strong></div><div class="fact"><span>本段啟動日</span><strong class="date-value">${esc(observation.trigger_date||'尚未提供')}</strong></div></div><p class="footnote">${observation.price_window_complete===false?'觀察區間資料不完整。':''}研究估計尚待驗證，保存的狀態不代表未來報酬。</p>${path.length?`<details class="source-details"><summary>已保存的生命週期紀錄（最近 ${path.length} 筆）</summary><div class="table-scroll"><table><thead><tr><th>資料日</th><th>保存價格</th><th>狀態</th><th>距起點</th><th>距高點</th></tr></thead><tbody>${path.map(row=>`<tr><td>${esc(row.date)}</td><td>${num(row.close)}</td><td>${esc(lifecycleNames[row.state]||'狀態待核對')}</td><td>${percent(row.gain_from_base)}</td><td>${percent(row.drawdown_from_peak)}</td></tr>`).join('')}</tbody></table></div></details>`:''}</article></section>`;
}
export function renderStock(body,{showLights=true}={}){
  const signals=body.signals,row=signals.summary;
  const observation=renderObservation(body.observation);
  if(signals.status==='MISSING')return `${empty('此股票未列於這個資料日的訊號保存檔，沒有可顯示的燈號。')}${observation}`;
  const header=`<article class="card signal-summary"><div class="card-head"><h3>${esc(body.stock_id)} ${esc(body.name)}</h3><span class="chip">可用 ${row.available_light_count} / 40</span></div><p class="signal-date">資料日 ${esc(signals.date)}；新增與熄燈是這個保存資料日的比較。</p><div class="signal-summary-counts"><span class="red">正向紅 <strong>${row.positive_lights}</strong></span><span class="green">負向綠 <strong>${row.negative_lights}</strong></span><span>資料不足 <strong>${row.missing_lights}</strong></span><span>新增紅 <strong>${row.new_positive_today}</strong></span><span>新亮燈 <strong>${row.new_lights_today}</strong></span><span>熄燈 <strong>${row.lights_off_today}</strong></span></div><p class="footnote">面向摘要（正向／負向）</p>${renderFacets(row)}<p class="footnote">${row.transition_unknown_count} 顆前次比較未知。第一次保存或前次資料不足不計為新增／熄燈；紅燈數量不代表勝率。</p></article>`;
  const lights=Object.entries(FACETS).map(([facet,name])=>`<section class="signal-facet"><h4>${name}</h4><div class="signal-grid">${LAMPS.filter(spec=>spec.category===facet).map(spec=>{const lamp=signals.lights.find(l=>l.id===spec.id);return `<details class="signal-lamp ${lamp.state.toLowerCase()}" data-lamp-id="${esc(lamp.id)}"><summary><span class="signal-lamp-title">${esc(lampName(spec))}</span>${badge(lamp.state)}<span class="signal-reading">${esc(lamp.display_value||STATES[lamp.state])}</span></summary><div class="signal-lamp-body">${lamp.metrics.length?`<dl class="signal-metrics">${lamp.metrics.map(metric=>`<div><dt>${esc(metric.label)}</dt><dd>${esc(formatMetric(metric))}</dd></div>`).join('')}</dl>`:'<p>這顆燈未提供可公開的數值明細。</p>'}<dl class="signal-continuity"><div><dt>保存資料日</dt><dd>${esc(lamp.date)}</dd></div><div><dt>首次可確認亮燈</dt><dd>${esc(lamp.first_lit_date||'尚未觀測到確切起點')}</dd></div><div><dt>至少自此已知亮燈</dt><dd>${esc(lamp.known_since||'尚未建立')}</dd></div><div><dt>連續亮燈</dt><dd>${Number.isInteger(lamp.consecutive_lit_days)?`${lamp.streak_left_censored?'至少 ':''}${lamp.consecutive_lit_days} 個交易日`:'未知'}</dd></div><div><dt>前次狀態</dt><dd>${esc(STATES[lamp.previous_state]||'未知')}</dd></div><div><dt>資料日變化</dt><dd>${lamp.transition_known?`${lamp.new_positive_today?'新增紅燈；':''}${lamp.new_lit_today?'新亮燈；':''}${lamp.extinguished_today?'原燈熄滅；':''}${!lamp.new_lit_today&&!lamp.extinguished_today?'無變化':''}`:'比較未知，不計為新增／熄燈'}</dd></div></dl></div></details>`;}).join('')}</div></section>`).join('');
  return header+(showLights?lights:'')+observation;
}

export function validateIndicators(data){
  if(data?.schema!=='MARKET_INDICATORS_DISPLAY_V1'||!validDate(data.as_of)||!Array.isArray(data.metrics)||data.metrics.length>100||data.raw_data_included!==false||data.ETF_holdings_included!==false)throw Error('指標摘要格式未通過核對。');
  if(data.publication_policy!=='NO_INSTITUTION_OR_FUTURES_VALUES_20261029_V1'||data.institution_and_futures_values_included!==false||data.metrics.some(m=>!['price','volume','trend','breadth','credit','pending'].includes(m.category)||m.id==='put_call'))throw Error('公開指標範圍不符。');
  const ids=new Set();
  for(const m of data.metrics){
    if(ids.has(m.id)||typeof m.id!=='string'||m.as_of!==data.as_of||m.is_probability!==false||m.trial_lamp!==null||!['AVAILABLE','MISSING'].includes(m.status)||!Array.isArray(m.comparisons)||m.comparisons.map(c=>c.sessions).join()!=='1,5,10,20')throw Error('指標欄位未通過核對。');
    ids.add(m.id);if(m.status==='AVAILABLE'&&!Number.isFinite(m.value)||m.status==='MISSING'&&m.value!==null)throw Error('缺值不可當成零。');
    for(const c of m.comparisons){
      if(c.baseline_date!==data.baseline_dates[String(c.sessions)]||!validDate(c.baseline_date)||c.baseline_date>=data.as_of)throw Error('比較交易日不符。');
      if(c.difference!==null&&(!Number.isFinite(c.baseline)||!Number.isFinite(m.value)||Math.abs(c.difference-(m.value-c.baseline))>1e-6))throw Error('比較差異不符。');
    }
  }
  if(data.probabilities.map(p=>p.horizon_sessions).join()!=='5,10,20'||data.probabilities.some(p=>p.p_up!==null||p.p_down!==null||p.p_flat!==null||p.status!=='MODEL_NOT_ESTABLISHED'))throw Error('未建立的模型不可顯示機率。');
  return data;
}

export function indicatorRows(data,market='TAIEX',group='all',n=1,mode='point'){
  validateIndicators(data);
  const groups={price:['price','volume','trend'],breadth:['breadth'],credit:['credit','pending']};
  if(!['TAIEX','TPEx'].includes(market)||![1,5,10,20].includes(n)||!['point','prior_mean','sum'].includes(mode))throw Error('比較選項無效。');
  return data.metrics.filter(m=>(!m.id.startsWith('TAIEX_')&&!m.id.startsWith('TPEx_')||m.id.startsWith(market+'_'))&&(group==='all'&&m.category!=='sample_institution'||groups[group]?.includes(m.category))).map(m=>{
    const c=m.comparisons.find(c=>c.sessions===n);
    const base=mode==='point'?c.baseline:mode==='prior_mean'?m.prior_means?.[n]??null:null;
    const delta=mode==='point'?c.difference:mode==='prior_mean'&&Number.isFinite(m.value)&&Number.isFinite(base)?m.value-base:null;
    const sum=mode==='sum'?m.trailing_sums?.[n]??null:null;
    const direction=mode==='sum'?(Number.isFinite(sum)?'已計算累計':'不適用／資料不足'):delta===null?'資料不足':delta>0?'增加':delta<0?'減少':'持平';
    return {...m,baseline:base,delta,sum,direction,baseline_date:c.baseline_date};
  });
}

export function renderIndicatorTable(data,{market='TAIEX',group='all',n=1,mode='point'}={}){
  const fmt=v=>Number.isFinite(v)?v.toLocaleString('zh-TW',{maximumFractionDigits:3}):'—';
  const sign=v=>Number.isFinite(v)?`${v>0?'+':''}${fmt(v)}`:'—';
  const baseTitle=mode==='point'?`${n===1?'昨日':`${n} 交易日前`}（${data.baseline_dates[n]}）`:mode==='prior_mean'?`前 ${n} 日均值（不含當日）`:`近 ${n} 日累計（含當日）`;
  const rows=indicatorRows(data,market,group,n,mode);
  return `<table class="indicator-table"><thead><tr><th>指標／口徑</th><th>資料日 ${esc(data.as_of)}</th><th>${esc(baseTitle)}</th><th>${mode==='sum'?'狀態':'差異／變化'}</th></tr></thead><tbody>${rows.map(m=>`<tr><td data-label="指標"><strong>${esc(m.label)}</strong><span class="indicator-unit">${esc(m.unit)}${m.sample_count!==undefined?` · 固定樣本 ${m.sample_count}/${m.target_universe_count} 家`:''}</span><details><summary>來源與規則</summary><p>${esc(m.source)}<br>${esc(m.note)}</p></details></td><td data-label="當日"><strong>${fmt(m.value)}</strong>${m.value===null?`<small>當日待資料${m.last_available_date?`；最近可用 ${esc(m.last_available_date)}：${fmt(m.last_available_value)} ${esc(m.unit)}`:''}</small>`:''}</td><td data-label="${esc(baseTitle)}">${fmt(mode==='sum'?m.sum:m.baseline)}${mode!=='point'&&(mode==='sum'?m.sum:m.baseline)===null?'<small>不適用或完整窗口不足</small>':''}</td><td data-label="變化"><span class="indicator-state ${m.direction==='資料不足'?'pending':''}">${esc(m.direction)}</span>${mode==='sum'?'':`<strong class="indicator-change">${sign(m.delta)} ${esc(m.unit)}</strong>`}</td></tr>`).join('')}</tbody></table>`;
}

async function mountMarketIndicators(){
  const host=document.getElementById('marketIndicators');if(!host)return;
  try{
    const base=new URL('../research-showcases/market-indicators/',location.href);
    const mr=await fetch(new URL('manifest.json',base),{cache:'no-store'});if(!mr.ok)throw Error();const manifest=await mr.json();
    if(manifest.schema!=='MARKET_INDICATORS_MANIFEST_V1'||!validDate(manifest.as_of)||manifest.ETF_holdings_included!==false)throw Error();
    const dr=await fetch(new URL('data.json',base),{cache:'no-cache'});if(!dr.ok)throw Error();const bytes=await dr.arrayBuffer();await verifyResourceBytes(bytes,manifest.files['data.json']);
    const data=validateIndicators(JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(bytes)));if(data.as_of!==manifest.as_of)throw Error();
    host.innerHTML=`<div class="section-heading"><div><div class="eyebrow">MARKET DASHBOARD</div><h3>大盤指標與變化</h3></div><span class="chip">描述性狀態・試行介面</span></div><p class="indicator-intro">先看資料，再看變化。增加／減少只描述數值方向，不等於多空訊號或買賣建議。</p><p class="notice">指標比較快照 <strong>${esc(data.as_of)}</strong> · ${data.metrics.filter(m=>m.status==='AVAILABLE').length}/${data.metrics.length} 項當日可用（含兩市場）。${data.automatic_refresh_installed?'已接上當日研究發布後刷新；設定已安裝，實際更新以此資料日為準。':'此比較快照尚未接上每日自動刷新。'}缺資料保留「—」，不以舊值補今日。</p><div class="indicator-controls"><label>市場<select id="indicatorMarket"><option value="TAIEX">上市／加權</option><option value="TPEx">上櫃／櫃買</option></select></label><label>指標<select id="indicatorGroup"><option value="all">全部指標</option><option value="price">價格・量能・趨勢</option><option value="breadth">市場廣度</option><option value="credit">融資・待接來源</option></select></label><label>比較期間<select id="indicatorPeriod"><option value="1">昨日（1交易日前）</option><option value="5">5交易日前</option><option value="10">10交易日前</option><option value="20">20交易日前</option></select></label><label>比較方式<select id="indicatorMode"><option value="point">指定交易日：當日 − 基準日</option><option value="prior_mean">量能：對前 N 日均值</option></select></label></div><p id="indicatorBasis" class="footnote"></p><div id="indicatorTable" class="table-scroll"></div><div class="indicator-contracts"><details><summary>哪些可以當成大盤燈號？</summary><p>既有市場 State Engine 的上升／局部修正與回撤位置保留於下方。這一版先呈現資料與方向，沒有新增未回測的紅綠綜合分數。</p><p>個股分點集中、相對大盤／產業族群、個股火藥桶的母體與規則不同，不能直接套在指數上。目前未找到可驗證的大盤專用火藥桶規則。</p><p>法人與期貨資料保留本地追蹤，不放入本頁公開摘要，也未納入已採用的大盤機率。</p></details></div><section class="market-outlook"><h3>大盤綜合機率</h3><p class="footnote">價格指數未來交易日報酬；新模型研究中。下方既有 H20／H60 是總報酬、特定觸發條件且排除平盤的研究估計，不能直接填入這裡。</p><div class="outlook-grid">${[5,10,20].map(n=>`<article class="outlook-card"><h4>未來 ${n} 個交易日</h4><span class="indicator-state pending">待建立並驗證</span><dl><div><dt>上漲</dt><dd>—</dd></div><div><dt>下跌</dt><dd>—</dd></div><div><dt>平盤</dt><dd>—</dd></div></dl></article>`).join('')}</div></section>`;
    const paint=()=>{const opts={market:document.getElementById('indicatorMarket').value,group:document.getElementById('indicatorGroup').value,n:Number(document.getElementById('indicatorPeriod').value),mode:document.getElementById('indicatorMode').value};document.getElementById('indicatorTable').innerHTML=renderIndicatorTable(data,opts);document.getElementById('indicatorBasis').textContent=opts.mode==='point'?`基準日 ${data.baseline_dates[opts.n]} → ${data.as_of}；使用已核實交易日，不是曆日或最近 N 列。`:`均值不含當日，適用量能；任一應有交易日缺資料就不計算。`;};
    for(const id of ['indicatorMarket','indicatorGroup','indicatorPeriod','indicatorMode'])document.getElementById(id).addEventListener('change',paint);paint();
  }catch{host.innerHTML='<h3>大盤指標與變化</h3>'+empty('指標摘要尚未通過版本或來源核對；其他已發布區塊仍可查看。');}
}

// Display-only rankings: saved predictions stay unchanged. No fit, inference or source API.
export const RANK_MODEL_IDS=['FINAL20260831_FULL45_H20_DIRECTION5','FINAL20260831_FULL45_PLUS7_H20_DIRECTION5'];
export const rankModelName=id=>id.includes('PLUS7')?'FULL45＋價量七燈':'FULL45';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const stockCodeOrder=(a,b)=>a.stock_id<b.stock_id?-1:a.stock_id>b.stock_id?1:0;
export function percentileRanks(rows,compare){
  const sorted=[...rows].sort(compare),out=new Map(),n=sorted.length;
  for(let a=0;a<n;){let b=a+1;while(b<n&&compare(sorted[a],sorted[b])===0)b++;
    const score=n===1?50:100*(a+(b-1))/2/(n-1);
    for(let i=a;i<b;i++)out.set(sorted[i].stock_id,score);a=b;
  }return out;
}
export function validateV1Display(data){
  const v=data?.v1;
  if(!v||!validDate(v.data_date)||v.horizon_market_sessions!==20||v.mode!=='POST_CUTOFF_REPLAY'||v.basis!=='PRICE_RETURN'||!Array.isArray(v.records)||!Array.isArray(v.not_scored)||!Array.isArray(v.models)||v.models.length!==2||RANK_MODEL_IDS.some(x=>!v.models.includes(x)))throw Error('模型日期、期間或版本未通過核對。');
  const ids=new Set(),hashes=new Map();
  for(const r of v.records){
    if(!validId(r.stock_id)||ids.has(r.stock_id)||r.signal_date!==v.data_date||!Array.isArray(r.predictions)||r.predictions.length!==2)throw Error('模型逐股資料不一致。');ids.add(r.stock_id);
    const models=new Set();for(const p of r.predictions){const d=p.direction3;
      if(!RANK_MODEL_IDS.includes(p.model_id)||models.has(p.model_id)||!hashValue(p.model_sha256)||!d||['p_up','p_down','p_flat'].some(k=>!finite(d[k])||d[k]<0||d[k]>1)||Math.abs(d.p_up+d.p_down+d.p_flat-1)>1e-6)throw Error('機率欄位不完整。');
      if(hashes.has(p.model_id)&&hashes.get(p.model_id)!==p.model_sha256)throw Error('同名模型版本不同。');hashes.set(p.model_id,p.model_sha256);models.add(p.model_id);
    }
  }
  return data;
}
export function buildDisplayRanks(data,summary,{model=RANK_MODEL_IDS[0],direction='up',horizon=20}={}){
  validateV1Display(data);
  if(!RANK_MODEL_IDS.includes(model)||!['up','down'].includes(direction)||horizon!==data.v1.horizon_market_sessions)throw Error('此模型／期間／方向尚未提供。');
  const date=data.v1.data_date,key=direction==='up'?'p_up':'p_down',lightKey=direction==='up'?'positive_lights':'negative_lights';
  // Existing published signal validator owns the 40-light semantics (GRAY is available).
  const signal=summary?validateSignalSummary(summary):null;
  const predictions=data.v1.records.map(r=>({...r,p:r.predictions.find(p=>p.model_id===model),probability:r.predictions.find(p=>p.model_id===model).direction3[key]})).sort((a,b)=>b.probability-a.probability||stockCodeOrder(a,b));
  predictions.forEach((r,i)=>r.prediction_rank=i+1);
  const excluded=[],cohort=[];
  for(const r of predictions){const s=signal?.byStock.get(r.stock_id);let reason=null;
    if(!signal)reason='燈號資料尚未就緒';else if(signal.date!==date)reason=`日期不同：燈號 ${signal.date}／機率 ${date}`;
    else if(!s)reason='缺少同日燈號';else if(!s.eligible)reason='未具備同日燈號資格';else if(s.available_light_count===0)reason='沒有有效燈號';
    if(reason){excluded.push({stock_id:r.stock_id,name:r.name,reason});continue;}
    cohort.push({...r,light_count:s[lightKey],available:s.available_light_count,missing:s.missing_lights,light_ratio:s[lightKey]/s.available_light_count});
  }
  const pp=percentileRanks(cohort,(a,b)=>a.probability-b.probability);
  // Cross multiplication keeps equal proportions (1/2 and 2/4) tied exactly.
  const lp=percentileRanks(cohort,(a,b)=>a.light_count*b.available-b.light_count*a.available);
  const composite=cohort.map(r=>({...r,probability_percentile:pp.get(r.stock_id),light_percentile:lp.get(r.stock_id),score:(pp.get(r.stock_id)+lp.get(r.stock_id))/2})).sort((a,b)=>b.score-a.score||b.probability-a.probability||stockCodeOrder(a,b));
  composite.forEach((r,i)=>r.composite_rank=i+1);
  return {date,model,direction,horizon,predictions,composite,excluded,not_scored:data.v1.not_scored,signal_date:signal?.date??null};
}

export const probabilityDifference=d=>finite(d?.p_up)&&finite(d?.p_down)?d.p_up-d.p_down:null;
const predictionSortLabels={delta:'多空機率差',up:'上漲機率',down:'下跌機率'};
export function nextPredictionSort(current,field){
  if(!(field in predictionSortLabels))throw Error('未知排序欄位');
  return {field,order:current.field===field&&current.order==='desc'?'asc':'desc'};
}
export function sortPredictionRanks(rows,{field='delta',order='desc'}={}){
  if(!(field in predictionSortLabels)||!['asc','desc'].includes(order))throw Error('未知排序設定');
  const value=r=>{const d=r.p?.direction3;return field==='delta'?probabilityDifference(d):d?.[field==='up'?'p_up':'p_down'];};
  return [...rows].sort((a,b)=>{const x=value(a),y=value(b);if(!finite(x)||!finite(y))return finite(x)?-1:finite(y)?1:stockCodeOrder(a,b);return (order==='desc'?y-x:x-y)||stockCodeOrder(a,b);}).map((r,i)=>({...r,prediction_rank:i+1}));
}
export function predictionSortControls(state){
  return `<div class="prediction-sort" role="group" aria-label="機率欄位排序">${Object.entries(predictionSortLabels).map(([field,label])=>`<button type="button" data-prediction-sort="${field}" aria-pressed="${state.field===field}" aria-label="${label}，${state.field===field?(state.order==='desc'?'目前由高到低，點擊改為由低到高':'目前由低到高，點擊改為由高到低'):'點擊由高到低排序'}">${label} ${state.field===field?(state.order==='desc'?'↓':'↑'):'↕'}</button>`).join('')}</div>`;
}
const probabilityDifferenceText=d=>{const v=probabilityDifference(d);return v===null?'—':`${v>0?'+':''}${(v*100).toFixed(1)} 百分點`;};
export const predictionDefinition='目前為未來 20 個市場交易日（H20）期末相對起點的價格報酬，不是隔天、也不是期間內曾經觸及。上漲：超過 +0.1%；下跌：低於 −0.1%；持平：−0.1% 至 +0.1%。多空機率差＝上漲機率−下跌機率，單位為百分點，不是預估漲幅。5 日、10 日尚未提供。';
let predictionSort={field:'delta',order:'desc'};

let rankSelection={model:RANK_MODEL_IDS[0],direction:'up'};
const rankingContextCache=createResourceCache();
export async function readSavedModels(base=location.href,fetcher=fetch){
  return rankingContextCache.get(new URL('../research-showcases/model-observation/',base).href,async()=>{
    const folder=new URL('../research-showcases/model-observation/',base);
    const response=await fetcher(new URL('manifest.json',folder),{cache:'no-store'});if(!response.ok)throw Error('模型展示收據尚未取得。');const manifest=await response.json();
    const r=await fetcher(new URL('display.json',folder),{cache:'no-cache'});if(!r.ok)throw Error('已保存機率暫時無法讀取。');const bytes=await r.arrayBuffer();await verifyResourceBytes(bytes,manifest.files?.['display.json']);
    const data=validateV1Display(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)));
    if(manifest.v1_data_date!==data.v1.data_date)throw Error('模型展示日期不一致。');return data;
  });
}
export function rankCard(r,kind,direction){
  const d=r.p.direction3,rank=kind==='composite'?r.composite_rank:r.prediction_rank;
  return `<article class="rank-card"><header><span class="rank-number">${rank}</span><a href="#stock/${esc(r.stock_id)}" data-rank-model="${esc(r.p.model_id)}" data-rank-direction="${direction}"><strong>${esc(r.stock_id)} ${esc(r.name)}</strong><small>${esc(r.market)}</small></a>${kind==='composite'?`<div class="rank-score"><strong>${r.score.toFixed(2)}</strong><small>綜合分數／100</small></div>`:''}</header><div class="rank-probs"><span class="rank-difference">多空機率差 <b>${probabilityDifferenceText(d)}</b></span><span class="red">上漲機率 <b>${probabilityText(d.p_up)}</b></span><span class="green">下跌機率 <b>${probabilityText(d.p_down)}</b></span><span>平盤機率 <b>${probabilityText(d.p_flat)}</b></span></div>${kind==='composite'?`<div class="rank-light">${direction==='up'?'正向紅燈':'負向綠燈'} <b>${r.light_count} / ${r.available}</b> 有效燈（${(r.light_ratio*100).toFixed(1)}%）<span>另 ${r.missing} 顆資料不足</span></div><details><summary>兩項百分位與計算</summary><p>${direction==='up'?'上漲':'下跌'}機率百分位 <b>${r.probability_percentile.toFixed(2)}</b>；燈號比例百分位 <b>${r.light_percentile.toFixed(2)}</b></p><p>（${r.probability_percentile.toFixed(2)} ＋ ${r.light_percentile.toFixed(2)}）÷ 2 ＝ ${r.score.toFixed(2)}。只在同一合格股票池比較。</p></details>`:`<p class="footnote">依所選機率欄位排序；不是預估漲幅；${rankModelName(r.p.model_id)}。</p>`}</article>`;
}
export const rankingExplanation=`綜合分數＝機率百分位 × 50% ＋ 燈號比例百分位 × 50%。上漲榜用正向紅燈，下跌榜用負向綠燈；分母是所有有效燈（含灰燈，不含缺資料）。同日、同 H20、同模型、同合格股票池才比較。百分位由低至高：100 ×（平均名次 − 1）／（N − 1），相同值平均名次；只有一檔時兩項均為 50。綜合分數同分，依原方向機率、再代碼排序。這是介面試用排序，不是新機率，也不是已驗證的新模型。`;
export function rankControls(id){return `${id==='prediction'?`<p class="notice">${predictionDefinition}</p><div id="predictionSortControls">${predictionSortControls(predictionSort)}</div>`:''}<div class="rank-controls"><label>模型<select id="${id}Model">${RANK_MODEL_IDS.map(x=>`<option value="${x}">${rankModelName(x)}</option>`).join('')}</select></label><label>預測期間<select id="${id}Horizon"><option value="20">20 個市場交易日（H20）</option></select></label><label>排序方向<select id="${id}Direction"><option value="up">${id==='prediction'?'偏多：多空差由高到低':'上漲機率由高到低'}</option><option value="down">${id==='prediction'?'偏空：多空差由低到高':'下跌機率由高到低'}</option></select></label><label>找股票<input id="${id}Query" type="search" placeholder="股號或部分名稱"></label></div>`;}
export function setupRankingViews(getSummary){
  document.addEventListener('click',event=>{const a=event.target.closest('[data-rank-model]');if(a&&RANK_MODEL_IDS.includes(a.dataset.rankModel)&&['up','down'].includes(a.dataset.rankDirection))rankSelection={model:a.dataset.rankModel,direction:a.dataset.rankDirection};});
  const groups=new Map();let promise;
  const get=()=>promise??=readSavedModels();
  async function paint(kind,reset=true){const el=document.getElementById(kind+'View');if(!el)return;const prefix=kind==='predictions'?'prediction':'composite';
    if(reset)el.dataset.limit='30';const limit=Number(el.dataset.limit||30);
    try{const data=await get(),model=document.getElementById(prefix+'Model').value,direction=document.getElementById(prefix+'Direction').value,summary=getSummary();
      const key=[model,direction,summary?.build_id,summary?.as_of].join(':');if(!groups.has(key))groups.set(key,buildDisplayRanks(data,summary,{model,direction}));const ranks=groups.get(key),rows=kind==='predictions'?sortPredictionRanks(ranks.predictions,predictionSort):ranks.composite,q=document.getElementById(prefix+'Query').value.trim().toLowerCase();
      const shown=rows.filter(r=>(r.stock_id+' '+r.name).toLowerCase().includes(q));
      if(kind==='predictions')document.getElementById('predictionSortControls').innerHTML=predictionSortControls(predictionSort);
      document.getElementById(prefix+'Status').textContent=`資料日 ${ranks.date} · ${rankModelName(model)} · H20 · 合格 ${rows.length} 檔；符合搜尋 ${shown.length} 檔。搜尋不改變原排名。${kind==='composite'?`另 ${ranks.excluded.length} 檔缺少合格同日燈號，未納排名。`:''}`;
      document.getElementById(prefix+'Rows').innerHTML=shown.length?shown.slice(0,limit).map(r=>rankCard(r,kind==='predictions'?'predictions':'composite',direction)).join(''):empty('沒有符合條件的股票。可清除搜尋或切換模型。');
      const button=document.getElementById(prefix+'More');button.hidden=shown.length<=limit;button.onclick=()=>{el.dataset.limit=String(limit+30);paint(kind,false);};
      document.getElementById(prefix+'Missing').innerHTML=[...(kind==='composite'?ranks.excluded:[]),...ranks.not_scored.map(r=>({...r,reason:'模型未計分：'+r.reason}))].filter(r=>(r.stock_id+' '+r.name).toLowerCase().includes(q)).map(r=>`<li><a href="#stock/${esc(r.stock_id)}">${esc(r.stock_id)} ${esc(r.name)}</a>：${esc(r.reason)}</li>`).join('');
      document.getElementById(prefix+'Version').textContent=`${data.v1.model_version} · ${model} · ${data.v1.mode} · 保存 ${data.v1.issued_at}。資訊截止 ${data.v1.information_cutoff}。校準器已擬合，尚未通過前瞻驗證。`;
      document.getElementById(prefix+'Overlap').hidden=!model.includes('PLUS7');
    }catch(e){document.getElementById(prefix+'Status').textContent=e.message;document.getElementById(prefix+'Rows').innerHTML=empty('保留燈號及其他可用資料；不以舊日或零機率補入。');}
  }
  for(const kind of ['predictions','composite']){const prefix=kind==='predictions'?'prediction':'composite';for(const s of ['Model','Direction','Horizon'])document.getElementById(prefix+s).onchange=()=>{if(kind==='predictions'&&s==='Direction')predictionSort={field:'delta',order:document.getElementById(prefix+s).value==='up'?'desc':'asc'};paint(kind);};document.getElementById(prefix+'Query').oninput=()=>paint(kind);}
  document.addEventListener('click',e=>{const button=e.target.closest('[data-prediction-sort]');if(!button)return;predictionSort=nextPredictionSort(predictionSort,button.dataset.predictionSort);paint('predictions').then(()=>document.querySelector(`[data-prediction-sort="${predictionSort.field}"]`)?.focus());});
  return {paint,get,groups};
}
export async function mountStockRanks(body,summary,alive=()=>true){
  const host=document.getElementById('stockModelRanks');if(!host)return;
  try{const data=await readSavedModels();if(!alive())return;
    host.innerHTML=`<h3>漲跌預測與綜合排名</h3><p>機率資料日 ${esc(data.v1.data_date)}；燈號資料日 ${esc(summary?.as_of||'未提供')}。H20（20 個市場交易日期末）／價格報酬／POST_CUTOFF_REPLAY。</p><p class="footnote">${predictionDefinition}</p><div class="rank-controls"><label>模型<select id="stockRankModel">${RANK_MODEL_IDS.map(x=>`<option value="${x}"${x===rankSelection.model?' selected':''}>${rankModelName(x)}</option>`).join('')}</select></label><label>方向<select id="stockRankDirection"><option value="up"${rankSelection.direction==='up'?' selected':''}>上漲</option><option value="down"${rankSelection.direction==='down'?' selected':''}>下跌</option></select></label></div><div id="stockRankResult"></div><p class="footnote">${rankingExplanation}</p><p class="notice" id="stockRankOverlap" hidden>PLUS7 本身已使用價量七燈；再加入燈號可能重複加權。</p>`;
    const paint=()=>{const model=document.getElementById('stockRankModel').value,direction=document.getElementById('stockRankDirection').value,ranks=buildDisplayRanks(data,summary,{model,direction}),r=sortPredictionRanks(ranks.predictions,predictionSort).find(r=>r.stock_id===body.stock_id),c=ranks.composite.find(r=>r.stock_id===body.stock_id);
      document.getElementById('stockRankResult').innerHTML=r?`<p>${predictionSortLabels[predictionSort.field]}排名 ${r.prediction_rank} / ${ranks.predictions.length}${c?`；綜合排名 ${c.composite_rank} / ${ranks.composite.length}`:''}</p>`+rankCard(c||r,c?'composite':'predictions',direction)+(c?'':empty(ranks.excluded.find(r=>r.stock_id===body.stock_id)?.reason||'綜合排名資料不足')):empty('此股尚無合格模型結果：'+(data.v1.not_scored.find(r=>r.stock_id===body.stock_id)?.reason||'未在本次普通股模型池；燈號仍可查看。'));
      rankSelection={model,direction};document.getElementById('stockRankOverlap').hidden=!model.includes('PLUS7');};document.getElementById('stockRankModel').onchange=paint;document.getElementById('stockRankDirection').onchange=paint;paint();
  }catch(e){if(alive())host.innerHTML=`<h3>漲跌預測與綜合排名</h3>${empty(e.message+' 燈號資料仍可查看。')}`;}
}
// Chart slots never fabricate missing daily flows from rolling 5/10/20-day aggregates.
export function stockChartSeries(body,calendar){
  // 2026-10-23 closure is already verified in the installed market dashboard calendar evidence.
  // The older margin calendar still carries that null-price date; do not call it a trading day.
  const dates=[...new Set(calendar.filter(validDate))].filter(d=>d<=body.as_of&&d!=='2026-10-23').sort().slice(-20),path=new Map();
  for(const r of body.observation.path){if(path.has(r.date))throw Error('收盤價日期重複。');path.set(r.date,r);}
  return dates.map(date=>({date,price:finite(path.get(date)?.close)?path.get(date).close:null,trust:null,foreign:null,concentration:null}));
}
export function stockChartSvg(rows,field){
  const values=rows.map(r=>r[field]).filter(finite),prices=rows.map(r=>r.price).filter(finite),W=680,H=240,left=60,right=615,top=30,bottom=190,n=rows.length;
  const scale=Math.max(field==='concentration'?0.001:1,...values.map(Math.abs)),minP=prices.length?Math.min(...prices):0,maxP=prices.length?Math.max(...prices):1,range=maxP-minP||1;
  const x=i=>left+(i+.5)*(right-left)/Math.max(n,1),zero=field==='concentration'?bottom:(top+bottom)/2,py=p=>bottom-(p-minP)/range*(bottom-top);
  let marks='',path='',connected=false;
  rows.forEach((r,i)=>{if(finite(r[field])){const y=zero-r[field]/scale*(bottom-top)/(field==='concentration'?1:2);marks+=`<rect x="${x(i)-7}" y="${Math.min(y,zero)}" width="14" height="${Math.max(1,Math.abs(zero-y))}" fill="${r[field]>=0?'#ff9c9b':'#70d8b1'}"/>`;}
    if(finite(r.price)){path+=(connected?' L':' M')+x(i)+' '+py(r.price);connected=true;marks+=`<circle cx="${x(i)}" cy="${py(r.price)}" r="3" fill="#e8c884"/>`;}else connected=false;
    marks+=`<rect class="stock-chart-hit" data-chart-i="${i}" tabindex="0" role="button" aria-label="${r.date} ${finite(r.price)?'收盤價 '+r.price:'價格不足'}；柱值${finite(r[field])?r[field]:'資料不足'}" x="${x(i)-(right-left)/Math.max(n,1)/2}" y="${top}" width="${(right-left)/Math.max(n,1)}" height="${bottom-top}" fill="transparent"><title>${r.date}：收盤價 ${num(r.price)}；柱值 ${num(r[field])}</title></rect>`;
  });
  return `<svg class="stock-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="20交易日柱狀圖與未調整收盤價；缺資料留空"><line x1="${left}" x2="${right}" y1="${zero}" y2="${zero}" stroke="#48596e"/><text x="8" y="${top+4}" fill="#b4c2d4">${num(scale)}</text><text x="10" y="${zero+4}" fill="#b4c2d4">${values.length?'0':'待資料'}</text><path d="${path}" fill="none" stroke="#e8c884" stroke-width="2"/>${marks}<text x="${right+5}" y="${top+4}" fill="#e8c884">${prices.length?num(maxP):'—'}</text><text x="${right+5}" y="${bottom}" fill="#e8c884">${prices.length?num(minP):'—'}</text><text x="${left}" y="225" fill="#aebdd0">${rows[0]?.date||''}</text><text x="${right}" y="225" text-anchor="end" fill="#aebdd0">${rows.at(-1)?.date||''}</text></svg>`;
}
export function renderStockCharts(body,calendar){
  const rows=stockChartSeries(body,calendar);
  return `<section class="card detail-section"><h3>20 交易日籌碼與價格</h3><p class="footnote">時間由左至右，舊 → 新。金線為站內已收盤價（調整價口徑，非即時或未調整收盤價），右軸：元；缺日斷線。柱狀圖預留左軸，缺資料不畫零柱。可點選日期查看。</p>${[['trust','投信買賣超','張','trust'],['foreign','外資買賣超','張','foreign'],['concentration','分點買超集中度','HHI','broker_buy']].map(([field,title,unit,kind])=>{
    const metrics=[5,10,20].map(n=>{const l=body.signals.lights.find(l=>l.id===kind+'_'+n),metric=l?.metrics.find(m=>m.label===(field==='concentration'?'同方向HHI集中度':'淨買超／賣超'));return `<span>${n} 日${field==='concentration'?'窗口 HHI':'累計淨額'}：<b>${num(metric?.value)}</b> ${unit}</span>`;}).join('');
    return `<article class="stock-chart-panel" data-chart-field="${field}"><h4>${title}</h4><p>每日柱值尚未接入公開歷史；此版先顯示可用價格與已發布的窗口摘要，不把累計值冒充每日買賣超。</p>${stockChartSvg(rows,field)}<p class="chart-readout" role="status">點選圖上的日期；每日柱值目前資料不足。</p><div class="chart-summary">${metrics}</div>${field==='concentration'?'<p class="footnote">HHI 沿用原分點買超同方向集中度；5／10／20 日為各窗口的聚合結果，並非該日單日 HHI。原始分點明細不公開。</p>':''}</article>`;
  }).join('')}</section>`;
}
export function mountChartInteractions(body,calendar){const rows=stockChartSeries(body,calendar);for(const p of document.querySelectorAll('.stock-chart-panel')){const display=e=>{const hit=e.target.closest('[data-chart-i]');if(!hit)return;const r=rows[Number(hit.dataset.chartI)];p.querySelector('.chart-readout').textContent=`${r.date}｜收盤價：${num(r.price)} 元；每日柱值：資料不足。`;};p.addEventListener('click',display);p.addEventListener('focusin',display);}}

// Read-only chart and industry summaries, produced from adopted source artifacts.
let stockContextPromise=null;
export function validateStockContext(d){
  if(d?.schema!=='STOCK_CONTEXT_DISPLAY_V1'||!validDate(d.as_of)||!Array.isArray(d.dates)||d.dates.length!==20||d.dates.at(-1)!==d.as_of||new Set(d.dates).size!==20||d.dates.some((v,i)=>!validDate(v)||(i&&v<=d.dates[i-1])))throw Error('圖表交易日契約不符。');
  if(JSON.stringify(d.columns)!==JSON.stringify(['close_ntd','trust_net_lots','foreign_net_lots','buy_hhi_5d']))throw Error('圖表單位契約不符。');
  for(const [sid,rows] of Object.entries(d.stocks||{})){
    if(!/^[A-Za-z0-9]{2,10}$/.test(sid)||!Array.isArray(rows)||rows.length!==20||rows.some(r=>!Array.isArray(r)||r.length!==4||r.some(v=>v!==null&&!finite(v))||(r[0]!==null&&r[0]<=0)||(r[3]!==null&&(r[3]<0||r[3]>1))))throw Error('圖表資料不完整或值域錯誤。');
  }
  if(!Array.isArray(d.sectors?.groups)||!Array.isArray(d.sectors.coverage)||d.sectors.coverage.at(-1)?.date!==d.as_of)throw Error('族群資料日期不一致。');
  const names=new Set();for(const g of d.sectors.groups){if(typeof g.industry!=='string'||names.has(g.industry))throw Error('族群分類重複。');names.add(g.industry);for(const n of [1,5,10,20]){const c=g.comparisons?.[n];if(!c||c.expected_days!==n||!Number.isInteger(c.valid_days)||c.valid_days<0||c.valid_days>n)throw Error('族群比較基準錯誤。');}}
  return d;
}
export async function readStockContext(){
  if(!stockContextPromise)stockContextPromise=(async()=>{const root=new URL('../research-showcases/stock-context/',location.href),r=await fetch(new URL('manifest.json',root),{cache:'no-store'});if(!r.ok)throw Error('圖表資料尚未發布。');const m=await r.json();if(m.schema!=='STOCK_CONTEXT_MANIFEST_V1')throw Error('圖表版本不符。');const f=await fetch(new URL('data.json',root),{cache:'no-cache'});if(!f.ok)throw Error('圖表資料暫時不可讀。');const bytes=await f.arrayBuffer();await verifyResourceBytes(bytes,{sha256:m.data_sha256,bytes:m.data_bytes});const d=validateStockContext(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)));if(d.as_of!==m.as_of)throw Error('圖表收據日期不同。');return d;})().catch(e=>{stockContextPromise=null;throw e;});
  return stockContextPromise;
}
export function contextChartRows(data,id,day){
  if(data.as_of!==day)throw Error(`圖表資料日 ${data.as_of}，目前個股 ${day}，尚待同日更新。`);
  const values=data.stocks[id];return data.dates.map((date,i)=>({date,price:values?.[i]?.[0]??null,trust:values?.[i]?.[1]??null,foreign:values?.[i]?.[2]??null,concentration:values?.[i]?.[3]??null}));
}
export function contextChartsHtml(rows){
  const defs=[['trust','投信每日買賣超','張'],['foreign','外資每日買賣超','張'],['concentration','分點買超集中度｜滾動 5 日 HHI','HHI']];
  return `<h3>近 20 交易日籌碼與收盤價</h3><p class="footnote">由左至右，舊 → 新。金線：未調整收盤價（右軸／元）；柱：左軸標示單位。紅為買超、綠為賣超；集中度高低不代表多空。缺值留白、價格缺日斷線，可點選日期。</p>${defs.map(([field,title,unit])=>`<article class="stock-chart-panel" data-chart-field="${field}" data-chart-unit="${unit}"><h4>${title}</h4><p class="footnote">柱值 ${rows.filter(r=>finite(r[field])).length}／20 日；收盤價 ${rows.filter(r=>finite(r.price)).length}／20 日${field==='concentration'?'。原規則按最近5個交易日彙總各分點淨買超，正值占比平方和（0–1）；每根柱為該日的5日窗口，並非單日HHI。未保存或未通過原資格檢查者留白。':''}</p>${stockChartSvg(rows,field)}<p class="chart-readout" role="status">點選圖上的日期查看 ${unit} 與收盤價。</p></article>`).join('')}`;
}
export async function mountSavedCharts(body,alive=()=>true){
  const host=document.getElementById('savedStockCharts');
  try{const d=await readStockContext();if(!alive())return;const rows=contextChartRows(d,body.stock_id,body.as_of);host.innerHTML=contextChartsHtml(rows);
    for(const panel of host.querySelectorAll('.stock-chart-panel')){const show=e=>{const hit=e.target.closest('[data-chart-i]');if(!hit)return;const row=rows[Number(hit.dataset.chartI)];panel.querySelector('.chart-readout').textContent=`${row.date}｜收盤價 ${finite(row.price)?num(row.price)+' 元':'缺資料'}｜${panel.dataset.chartField==='concentration'?'5日HHI':'淨買賣'} ${finite(row[panel.dataset.chartField])?num(row[panel.dataset.chartField]):'缺資料'} ${panel.dataset.chartUnit}`;};panel.addEventListener('click',show);panel.addEventListener('focusin',show);}
  }catch(e){if(alive())host.innerHTML=`<h3>近20交易日圖表</h3>${empty(e.message+' 不用其他日期或0替代。')}`;}
}
export function sectorSorted(data,n){
  if(![1,5,10,20].includes(n))throw Error('無效比較期間');
  return [...data.sectors.groups].sort((a,b)=>{const av=a.comparisons[n].delta_pp,bv=b.comparisons[n].delta_pp;return (finite(av)?0:1)-(finite(bv)?0:1)||(finite(bv)&&finite(av)?bv-av:0)||a.industry.localeCompare(b.industry,'zh-TW');});
}
export function sectorCards(data,n){
  return sectorSorted(data,n).map((g,i)=>{const c=g.comparisons[n];return `<article class="rank-card sector-card"><header><span class="rank-number">${finite(c.delta_pp)?i+1:'—'}</span><strong>${esc(g.industry)}</strong><div class="rank-score"><strong class="${c.delta_pp>=0?'red':'green'}">${finite(c.delta_pp)?(c.delta_pp>=0?'+':'')+c.delta_pp.toFixed(3):'—'}</strong><small>占比增減百分點</small></div></header><div class="rank-facts"><div><span>今日成交占比</span><b>${num(g.share_pct)}%</b></div><div><span>${n===1?'昨日占比':`前${n}日平均占比`}</span><b>${num(c.prior_mean_pct)}%</b></div><div><span>相對增幅</span><b>${finite(c.relative_pct)?(c.relative_pct>=0?'+':'')+c.relative_pct.toFixed(2)+'%':'—'}</b></div><div><span>成交金額</span><b>${finite(g.turnover_ntd)?(g.turnover_ntd/1e8).toFixed(2)+' 億元':'缺資料'}</b></div><div><span>有效成交資料</span><b>${g.valid_turnover}/${g.members} 檔</b></div><div><span>比較有效日</span><b>${c.valid_days}/${c.expected_days} 日</b></div><div><span>等權平均漲跌</span><b>${num(g.mean_return_pct)}%（${g.return_n} 檔）</b></div><div><span>上漲家數</span><b>${g.up_count}/${g.return_n}</b></div><div><span>成交量高於前20日均量</span><b>${g.volume_expanded_count}/${g.volume_n}</b></div></div>${c.valid_days<n?'<p class="notice">比較歷史不足，排名只依已知日期，請一併看有效日數。</p>':''}</article>`;}).join('');
}
export async function mountSectors(){
  const host=document.getElementById('sectorContent');if(!host)return;
  try{const d=await readStockContext(),c=d.sectors.coverage.at(-1);host.innerHTML=`<p class="signal-date">資料日 ${esc(d.as_of)} · ${d.sectors.groups.length} 個互斥分類（含未分類）</p><p>比較各族群自己的成交占比，預設依較前20日平均增加的百分點排序。這是成交熱度，並非資金淨流入。</p><div class="rank-controls"><label>比較基準<select id="sectorBaseline"><option value="20">前20交易日平均</option><option value="10">前10交易日平均</option><option value="5">前5交易日平均</option><option value="1">昨日</option></select></label></div><p class="notice">分母為本站各日合格普通股樣本的已知成交額，非交易所完整市場：今日 ${c.valid_turnover}/${c.eligible_members} 檔成交有效、${c.classified}/${c.eligible_members} 檔有分類。包含未分類；不含ETF等其他證券。缺值不補0。</p><div id="sectorCards" class="rank-grid"></div><details class="source-details"><summary>分類、基準與每日覆蓋</summary><p>${esc(d.sectors.classification)}。${esc(d.sectors.baseline)}。漲跌採既有可比調整價日報酬的等權平均；量能廣度以前20日均量（不含今日）作基準。不是市值加權族群指數。</p><div class="table-scroll"><table><thead><tr><th>日期</th><th>成交有效／母體</th><th>已分類</th><th>分母億元</th></tr></thead><tbody>${d.sectors.coverage.map(r=>`<tr><td>${r.date}</td><td>${r.valid_turnover}/${r.eligible_members}</td><td>${r.classified}</td><td>${finite(r.denominator_ntd)?(r.denominator_ntd/1e8).toFixed(2):'缺資料'}</td></tr>`).join('')}</tbody></table></div></details>`;const paint=()=>document.getElementById('sectorCards').innerHTML=sectorCards(d,Number(document.getElementById('sectorBaseline').value));document.getElementById('sectorBaseline').onchange=paint;paint();
  }catch(e){host.innerHTML=empty(e.message+' 保留其他頁面；未提供數值不補0。');}
}

function init(){
  const byId=id=>document.getElementById(id);
  let manifest=null,read=null,stocks=[],summary=null,ranking=null,market=null,margin=null,signal=null,netRanking=null,route=parseRoute(location.hash),routeReady=false,selectionGeneration=0,buildReady=false,buildFailed=false;
  let filter={states:[],counts:[]},filterLimit=100;
  let rankingMarket='TWSE',rankingVisible={TWSE:RANKING_PAGE_SIZE,TPEX:RANKING_PAGE_SIZE};
  const paintRanking=()=>{
    byId('rankingControls').hidden=!netRanking;
    for(const market of Object.keys(RANKING_MARKETS)){const button=byId(`ranking${market}`),active=market===rankingMarket;button.disabled=!netRanking;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));}
    if(!netRanking){byId('rankingRows').innerHTML=empty('淨紅燈排行不可用：新的保存檔缺漏或未通過同一發布版本核對。');return;}
    const page=marketRankingPage(netRanking.rows,rankingMarket,rankingVisible[rankingMarket]);
    byId('rankingHeading').textContent=`今日淨紅燈排行｜${RANKING_MARKETS[rankingMarket]} Top 50`;byId('rankingScope').textContent=`${page.scopeLabel}${netRanking.market_counts.unknown?`保存摘要另有 ${netRanking.market_counts.unknown} 檔市場分類未提供，未列入排行。`:''}`;
    byId('rankingRows').innerHTML=renderRows(page.rows,true);byId('rankingProgress').textContent=page.progressLabel;byId('rankingMore').hidden=!page.hasMore;byId('rankingMore').textContent=page.moreLabel;
  };
  const detailCache=createResourceCache(),scrollPositions=new Map();
  byId('predictionControls').innerHTML=rankControls('prediction');byId('compositeControls').innerHTML=rankControls('composite');byId('compositeExplanation').textContent=rankingExplanation;
  const rankViews=setupRankingViews(()=>summary);
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
      byId('stockDetail').innerHTML='<section id="stockModelRanks" class="card stock-model-panel"><h3>漲跌預測與綜合排名</h3><p>正在讀取保存結果…</p></section>'+'<section id="savedStockCharts" class="card detail-section"><h3>近20交易日圖表</h3><p>正在讀取保存結果…</p></section>'+renderStock(body,{showLights:false});mountSavedCharts(body,()=>generation===selectionGeneration&&route.page==='stock'&&route.id===id);mountStockRanks(body,summary,()=>generation===selectionGeneration&&route.page==='stock'&&route.id===id);byId('detailStatus').textContent=body.signals.status==='AVAILABLE'?`已讀取資料日 ${body.signals.date} 的摘要、機率與圖表；完整燈號請見紅綠燈分頁。`:'此股票目前未提供短期訊號，以下顯示已保存研究摘要。';
    }catch(error){if(generation!==selectionGeneration||route.page!=='stock'||route.id!==id)return;byId('detailStatus').textContent=error.message;byId('stockDetail').innerHTML=empty('個股明細暫時無法顯示。可返回列表查看其他股票；此處不會以其他日期資料代替。');}
  }
  function applyRoute({reloadDetail=false}={}){
    const next=parseRoute(location.hash),changed=!routeReady||next.hash!==route.hash;
    if(routeReady&&changed)scrollPositions.set(route.hash,window.scrollY);
    route=next;routeReady=true;
    if(changed&&['home','stocks'].includes(route.page)){rankingVisible={TWSE:RANKING_PAGE_SIZE,TPEX:RANKING_PAGE_SIZE};paintRanking();}
    if(location.hash!==route.hash)history.replaceState(null,'',`${location.pathname}${location.search}${route.hash}`);
    const detail=route.page==='stock',isMarket=route.page==='market',isSectors=route.page==='sectors',rankPage=['predictions','composite'].includes(route.page),tab=detail?'stocks':route.page;
    document.body.dataset.route=route.page;byId('stockListView').hidden=detail||isMarket||rankPage||isSectors;byId('sharedStockSearch').hidden=isMarket||rankPage||isSectors;byId('sectorsView').hidden=!isSectors;byId('predictionsView').hidden=route.page!=='predictions';byId('compositeView').hidden=route.page!=='composite';if(rankPage)rankViews.paint(route.page);if(isSectors)mountSectors();byId('marketView').hidden=!isMarket;byId('stockDetailView').hidden=!detail;byId('homeMarketSection').hidden=route.page!=='home';
    for(const link of document.querySelectorAll('[data-route-tab]')){const active=link.dataset.routeTab===tab;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');}
    const title={home:'紅綠燈',market:'大盤觀察',stocks:'個股查詢',predictions:'漲跌預測',composite:'綜合排名',sectors:'族群',stock:`${route.id} 個股查詢`}[route.page];byId('pageHeading').textContent=title;document.title=`${title}｜台股健診雷達`;
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
  byId('stockSearch').addEventListener('submit',event=>{event.preventDefault();const query=byId('stockQuery').value.trim().toLocaleLowerCase('zh-TW'),codeExact=stocks.filter(stock=>stock.stock_id.toLocaleLowerCase('zh-TW')===query),exact=codeExact.length?codeExact:stocks.filter(stock=>stock.name.toLocaleLowerCase('zh-TW')===query),matches=exact.length?exact:searchStocks(stocks,query,Infinity);if(query&&matches.length===1){byId('searchStatus').textContent='';location.hash=`#stock/${matches[0].stock_id}`;}else{byId('searchStatus').textContent=matches.length>1?'有多檔符合，請選擇建議或輸入完整代號。':buildReady?'查無此股票。請嘗試代號、完整或部分名稱。':'搜尋資料尚未載入。';suggestions();}});
  byId('stockQuery').addEventListener('input',()=>{byId('searchStatus').textContent='';if(!byId('stockQuery').value.trim()&&route.page==='stock')location.hash='#stocks';suggestions();});byId('stockQuery').addEventListener('keydown',event=>{if(event.key==='Escape')hideSuggestions();});
  byId('rankingMore').addEventListener('click',()=>{if(!netRanking)return;rankingVisible[rankingMarket]=marketRankingPage(netRanking.rows,rankingMarket,rankingVisible[rankingMarket]).nextShown;paintRanking();});
  for(const market of Object.keys(RANKING_MARKETS))byId(`ranking${market}`).addEventListener('click',()=>{if(!netRanking)return;rankingMarket=market;paintRanking();});
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
      for(let i=0;i<results.length;i++){const result=results[i],kind=Object.keys(fixedResources)[i];if(result.status==='rejected'){failures.push(kind);continue;}try{const body=result.value.body;if(kind==='margin'){validateMargin(body);margin=body;}if(kind==='market'){validateMarket(body);market=body;}if(kind==='search')stocks=validateSearch(body,manifest);if(kind==='summary')summary=body;if(kind==='ranking')ranking=body;}catch{failures.push(kind);}}
      if(summary){try{signal=validateSignalSummary(summary);}catch{signal=null;failures.push('summary');}}
      if(signal&&ranking){try{netRanking=validateRanking(summary,ranking);if(ranking.row_count!==manifest.ranking_count)throw dataError();}catch{netRanking=null;failures.push('ranking');}}
      byId('homeMarketSummary').innerHTML=renderMarket(market,true);byId('marketCards').innerHTML=renderMarket(market);byId('marketResearch').innerHTML=renderMarketResearch(market);byId('marketDate').textContent=market?`大盤資料日 ${market.market_as_of||manifest.market_as_of}。市場狀態：${statusLabel(market.session_status)}。`:'大盤摘要目前無法讀取。';byId('marketNotes').textContent='行情為已保存收盤資料，非即時報價；模型估計保留其原觀測日。價格指數與含股利研究口徑分開呈現。';
      if(margin){mountIntegratedMargin(margin);}else{byId('marketMargin').innerHTML=empty('融資資料尚未通過同版完整性核對；暫停顯示。');}
      paintRanking();
      byId('rankingDate').textContent=netRanking?`資料日 ${netRanking.date}，上市／上櫃各取後端保存淨紅燈排名的前 50 名（分段顯示）；新增／熄燈皆是該資料日的比較，不表示今天發出新訊號。`:'淨紅燈排名資料目前無法讀取。';
      byId('loadStatus').textContent=failures.length?'部分已發布資料目前無法核對，受影響區塊暫停顯示；其餘區塊保持同一發布版本。':'已讀取同一發布版本的保存資料；切換頁面不會重新計算研究結果。';byId('loadStatus').classList.toggle('error',failures.length>0);
      buildReady=true;paintFilter();applyRoute({reloadDetail:true});
    }catch(error){buildFailed=true;byId('loadStatus').textContent=error.message;byId('loadStatus').classList.add('error');byId('rankingRows').innerHTML=empty('公開保存資料尚未就緒。');byId('homeMarketSummary').innerHTML=empty('大盤摘要尚未就緒。');byId('marketCards').innerHTML=empty('大盤摘要尚未就緒。');byId('detailStatus').textContent='此發布版本尚未通過核對，個股明細暫停顯示。';paintFilter();}
  }
  mountMarketIndicators();
  loadBuild();
}
if(typeof document!=='undefined'&&document.getElementById('stockSearch'))init();

export function validateMargin(body){
 if(body?.schema!=='PUBLIC_MARKET_MARGIN_V1'||body.chart?.anchor_date!=='2025-04-09'||body.chart?.use_in_model_features!==false||body.chart?.custom_anchor_enabled!==true||!Array.isArray(body.calendar)||body.calendar.at(-1)!==body.as_of||body.calendar.join()!==[...new Set(body.calendar)].sort().join())throw dataError();
 for(const m of ['TAIEX','TPEx']){const market=body.markets?.[m],rows=market?.price_and_margin;if(!Array.isArray(rows)||rows.map(r=>r.date).join()!==body.calendar.join())throw dataError();for(const r of rows){for(const k of ['price_close','margin_thousand','official_previous_thousand'])if(r[k]!==null&&(!Number.isFinite(r[k])||r[k]<=0))throw dataError();if(r.price_close!==null&&!hashValue(r.price_source_sha256)||r.margin_thousand!==null&&!hashValue(r.source_sha256))throw dataError();}if(market.coverage.money_observations!==rows.filter(r=>r.margin_thousand!==null).length)throw dataError();const last=rows.at(-1),expected=last.margin_thousand===null?null:last.margin_thousand/100000;if(market.waterline.amount_yi!==expected)throw dataError();if(market.ratios.some(r=>r.ratio_pct!==null))throw dataError();}
 return body;
}
export function mountIntegratedMargin(body){
 validateMargin(body);document.getElementById('marketMargin').innerHTML="<div class=\"margin-module\"><h3>大盤與融資累計漲幅</h3><p class=\"sub\">同日收盤歸零 · 回顧比較，非模型特徵</p><div class=\"waters\"><div class=\"water\"><h4>上市融資餘額</h4><div id=\"fixedWater-TAIEX\"></div></div><div class=\"water\"><h4>上櫃融資餘額</h4><div id=\"fixedWater-TPEx\"></div></div><div class=\"water\"><h4>兩市同日合計</h4><div id=\"fixedWater-combined\"></div></div></div><p id=\"marginAsOf\" class=\"notice\"></p><div class=\"controls\"><label>市場 <select id=\"fixedMarket\"><option value=\"TAIEX\">上市・加權指數</option><option value=\"TPEx\">上櫃・櫃買指數</option></select></label><label>顯示起日 <input id=\"fixedStart\" type=\"date\"></label><label>顯示迄日 <input id=\"fixedEnd\" type=\"date\"></label></div><div class=\"controls\"><label>比較起點 <input id=\"fixedAnchorDate\" type=\"date\" list=\"fixedAnchorOptions\"></label><datalist id=\"fixedAnchorOptions\"></datalist><button id=\"fixedApplyAnchor\" type=\"button\">套用起點</button><button id=\"fixedResetAnchor\" type=\"button\">回到 2025-04-09</button></div><p id=\"fixedValidDates\" class=\"sub\"></p><p id=\"fixedAnchorError\" aria-live=\"polite\"></p><p id=\"fixedAnchor\" class=\"sub\"></p><div class=\"legend\"><span class=\"blue\">● 大盤價格指數漲幅 %</span><span class=\"amber\">● 融資金額增幅 %</span></div><div id=\"fixedChart\"></div><p id=\"fixedCoverage\" class=\"sub\"></p><label>查看日期 <select id=\"fixedPoint\"></select></label><p id=\"fixedDetail\" aria-live=\"polite\"></p><p class=\"sub\">預設2025-04-09同日收盤，調整顯示區間不改起點；自訂起點需按套用，缺日不換日。兩市場共用日期，不表示各自最低點。上市4/9收盤17,391.76，盤中17,306.97不作分母。</p><details><summary>融資占市值（待資料）</summary><p id=\"fixedRatio\"></p></details><details><summary>來源與口徑</summary><p>價格：FinMind普通價格指數收盤。上市金額：MarginPurchaseMoney／TodayBalance（元）；上櫃：交易所融資金（仟元）。顯示億元＝仟元÷100,000。歷史取得版本是回顧資料，不改原模型。</p><p>日增減採同份報表的官方調整前日，可能與曲線前一日原報值不同；調帳與上市櫃移轉未逐筆歸因，不稱純資金流入。上櫃缺史保持斷線；市值母體未核齊，占比待資料。</p></details></div>";
 const pos=x=>typeof x==='number'&&Number.isFinite(x)&&x>0;
const fmt=(x,n=2)=>typeof x==='number'&&Number.isFinite(x)?x.toLocaleString('zh-TW',{minimumFractionDigits:n,maximumFractionDigits:n}):'待資料';
const signed=x=>typeof x==='number'&&Number.isFinite(x)?(x>0?'+':'')+fmt(x):'待資料';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function validAnchors(rows,calendar){return rows.filter(r=>calendar.includes(r.date)&&pos(r.price_close)&&pos(r.margin_thousand)).map(r=>r.date).sort();}
function chooseAnchor(rows,calendar,requested){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(requested))return {ok:false,reason:'請選擇完整日期。'};
  if(!calendar.includes(requested))return {ok:false,reason:'此日不在已核實的交易日資料中，可能休市或來源未補齊；未自動換日。'};
  if(!validAnchors(rows,calendar).includes(requested))return {ok:false,reason:'此日缺少同市場的收盤或融資金額，不能設為比較起點；未自動換日。'};
  return {ok:true,anchor:requested};
}

function fixedSeries(rows,calendar,anchor){
  if(calendar.join()!==[...new Set(calendar)].sort().join())throw Error('INVALID_TRADING_CALENDAR');
  const by=new Map(rows.map(r=>[r.date,r]));if(by.size!==rows.length)throw Error('DUPLICATE_DATE');
  const base=by.get(anchor),dates=calendar.filter(d=>d>=anchor);
  const result={anchor,base:base||null,rows:[],status:'ANCHOR_SOURCE_MISSING',missing:[]};
  if(!calendar.includes(anchor))result.missing.push('基準日交易曆／來源');
  if(!pos(base?.price_close))result.missing.push('基準日價格指數收盤');
  if(!pos(base?.margin_thousand))result.missing.push('基準日官方融資金額');
  if(result.missing.length)return result;
  result.rows=dates.map(date=>{
    const row=by.get(date)||{},p=pos(row.price_close)?100*(row.price_close/base.price_close-1):null,
      m=pos(row.margin_thousand)?100*(row.margin_thousand/base.margin_thousand-1):null;
    return {...row,date,price_pct:p,margin_pct:m,excess_pp:p!==null&&m!==null?m-p:null};
  });
  result.status=result.rows.every(r=>r.excess_pp!==null)?'COMPLETE':'PARTIAL';return result;
}

// The fixed anchor stays outside the display-window selection; never rebase.
function clipSeries(series,start,end){return {...series,rows:series.rows.filter(r=>(!start||r.date>=start)&&(!end||r.date<=end))};}

function svgPlot(series){
  if(!series.rows.length)return `<div class="chart-empty"><strong>${esc(series.anchor)} 的比較基準尚待來源</strong><p>${series.missing.map(esc).join('、')}。<br>暫不畫累計曲線；不改用 9 月或其他日期，也不把缺值當成零。</p></div>`;
  const rows=series.rows,vals=rows.flatMap(r=>[r.price_pct,r.margin_pct]).filter(v=>v!==null);
  const low=Math.min(0,...vals),high=Math.max(0,...vals),pad=Math.max((high-low)*.12,1),min=low-pad,max=high+pad;
  const width=typeof window!=='undefined'&&window.innerWidth<=700?360:1020,left=width===360?70:90,right=width===360?325:930;
  const x=i=>left+i/Math.max(rows.length-1,1)*(right-left),y=v=>320-(v-min)/(max-min)*270;
  let out=`<svg id="fixedMarginPlot" viewBox="0 0 ${width} 390" data-width="${width}" data-left="${left}" data-right="${right}" role="img" aria-label="自固定波段起點的大盤與融資累計漲幅，共用百分比刻度"><rect x="${left-10}" y="40" width="${right-left+20}" height="290" fill="#0b1728"/>`;
  for(let i=0;i<5;i++){const v=min+(max-min)*i/4;out+=`<line x1="${left-10}" x2="${right+10}" y1="${y(v)}" y2="${y(v)}" stroke="#293950"/><text x="${left-15}" y="${y(v)+4}" text-anchor="end" fill="#abc0d9" font-size="13">${v.toFixed(1)}%</text>`;}
  out+=`<line x1="${left-10}" x2="${right+10}" y1="${y(0)}" y2="${y(0)}" stroke="#d6e1ee" stroke-dasharray="6 4"/><text x="${right+12}" y="${y(0)+4}" fill="#d6e1ee" font-size="12">0%</text>`;
  for(const [key,color]of [['price_pct','#61b5ff'],['margin_pct','#f0c267']]){
    let segment=[];const flush=()=>{if(segment.length)out+=`<polyline data-series="${key}" fill="none" stroke="${color}" stroke-width="3" points="${segment.join(' ')}"/>`;segment=[];};
    const pointCount=rows.filter(r=>r[key]!==null).length;
    rows.forEach((r,i)=>{if(r[key]===null){flush();return;}segment.push(`${x(i)},${y(r[key])}`);if(pointCount<=90)out+=`<circle cx="${x(i)}" cy="${y(r[key])}" r="3" fill="${color}"/>`;});flush();
  }
  return out+`<text x="${left}" y="365" fill="#abc0d9" font-size="13">${esc(rows[0].date)}</text><text x="${right}" y="365" text-anchor="end" fill="#abc0d9" font-size="13">${esc(rows.at(-1).date)}</text></svg>`;
}

function mountFixed(data){
  const el=id=>document.getElementById(id);let market='TAIEX',anchor=data.chart.anchor_date,current;
  const available=data.calendar;el('fixedStart').value=data.chart.anchor_date;el('fixedEnd').value=available.at(-1);
  el('fixedAnchorDate').value=anchor;
  for(const key of ['TAIEX','TPEx','combined']){
    const w=key==='combined'?data.combined:data.markets[key].waterline;
    el('fixedWater-'+key).innerHTML=`<strong>${fmt(w.amount_yi)}${w.amount_yi===null?'':' 億元'}</strong><small>${esc(w.date||'同日資料待補')}<br>日增減 ${signed(w.change_yi)}${w.change_yi===null?'':' 億元'} · ${signed(w.change_pct)}${w.change_pct===null?'':'%'}</small>`;
  }
  function draw(){
    const m=data.markets[market],all=fixedSeries(m.price_and_margin,data.calendar,anchor);
    current=clipSeries(all,el('fixedStart').value,el('fixedEnd').value);el('fixedChart').innerHTML=svgPlot(current);
    el('fixedAnchor').textContent=`目前回顧起點 ${anchor}；價格收盤 ${fmt(all.base?.price_close)} 點，融資 ${pos(all.base?.margin_thousand)?fmt(all.base.margin_thousand/100000)+' 億元':'待資料'}。上市與上櫃共用日期，不表示各自最低點。`;
    const valid=validAnchors(m.price_and_margin,data.calendar);
    el('fixedValidDates').textContent=valid.length?`已具同日完整來源，可選 ${valid.length} 日：${valid.length<=8?valid.join('、'):valid[0]+' 至 '+valid.at(-1)+'（區間可能有缺日，以核實清單為準）'}。`:'此市場尚無同日價格與融資均完整的可選起點。';
    el('fixedAnchorOptions').innerHTML=valid.map(d=>`<option value="${esc(d)}"></option>`).join('');el('fixedApplyAnchor').disabled=!valid.length;
    el('fixedDetail').textContent='滑動或點選曲線可看日期、價格點數、融資億元、兩項累計漲幅及差值。';
    const raw=m.price_and_margin.filter(r=>pos(r.price_close)),money=m.price_and_margin.filter(r=>pos(r.margin_thousand));
    el('fixedCoverage').textContent=`已核對價格 ${raw.length} 日（${raw[0]?.date||'—'} 至 ${raw.at(-1)?.date||'—'}），融資金額 ${money.length} 日。${all.status==='ANCHOR_SOURCE_MISSING'?'目前基準仍缺資料，不能畫比較線。':all.status==='PARTIAL'?'部分日期缺資料，曲線在缺日斷開。':'目前來源涵蓋選定起點至資料日；不代表有更早歷史。'}`;
    const point=r=>`${r.date}｜價格 ${fmt(r.price_close)} 點 · 累計 ${signed(r.price_pct)}${r.price_pct===null?'':'%'}｜融資 ${pos(r.margin_thousand)?fmt(r.margin_thousand/100000)+' 億元':'待資料'} · 累計 ${signed(r.margin_pct)}${r.margin_pct===null?'':'%'}｜融資−大盤 ${signed(r.excess_pp)}${r.excess_pp===null?'':' pp'}${r.vintage==='OFFICIAL_ADJUSTED_PREVIOUS'?'｜融資採後一報表調整前日餘額':''}`;
    const svg=el('fixedMarginPlot');if(svg){const pick=event=>{const rect=svg.getBoundingClientRect(),width=Number(svg.getAttribute?.('data-width')||1020),left=Number(svg.getAttribute?.('data-left')||90),right=Number(svg.getAttribute?.('data-right')||930),u=(event.clientX-rect.left)/rect.width*width,i=Math.max(0,Math.min(current.rows.length-1,Math.round((u-left)/(right-left)*(current.rows.length-1))));el('fixedDetail').textContent=point(current.rows[i]);};svg.addEventListener('pointermove',pick);svg.addEventListener('click',pick);}
    el('fixedPoint').innerHTML=current.rows.map((r,i)=>`<option value="${i}">${esc(r.date)}</option>`).join('');el('fixedPoint').disabled=!current.rows.length;
    el('fixedPoint').onchange=e=>{el('fixedDetail').textContent=point(current.rows[Number(e.target.value)]);};
    const ratio=m.ratios.at(-1);el('fixedRatio').textContent=ratio?.ratio_pct!==null&&ratio?.ratio_pct!==undefined?`${fmt(ratio.ratio_pct)}% · ${ratio.label}`:'待同市場、同日總市值及母體定義；尚無可核對占比。';
  }
  el('fixedMarket').addEventListener('change',e=>{market=e.target.value;el('fixedAnchorError').textContent='市場已切換，保留目前起點；若此市場缺同日資料，會顯示待資料。';draw();});
  el('fixedApplyAnchor').addEventListener('click',()=>{
    const chosen=chooseAnchor(data.markets[market].price_and_margin,data.calendar,el('fixedAnchorDate').value);
    if(!chosen.ok){el('fixedAnchorError').textContent=chosen.reason+` 目前起點仍為 ${anchor}。`;return;}
    anchor=chosen.anchor;el('fixedAnchorError').textContent='已明確變更比較起點；兩線於同日歸零。';draw();
  });
  el('fixedResetAnchor').addEventListener('click',()=>{anchor=data.chart.anchor_date;el('fixedAnchorDate').value=anchor;el('fixedAnchorError').textContent='已回到預設 2025-04-09；缺資料時保留此日。';draw();});
  for(const id of ['fixedStart','fixedEnd'])el(id).addEventListener('change',()=>{if(el('fixedStart').value>el('fixedEnd').value){el('fixedDetail').textContent='顯示起日需早於迄日。';return;}draw();});draw();
}

 for(const id of ['fixedStart','fixedEnd','fixedAnchorDate']){const e=document.getElementById(id);e.min=body.calendar[0];e.max=body.as_of;}
 const adjustedDays=body.markets.TPEx.price_and_margin.filter(r=>r.margin_thousand!==null&&r.vintage==='OFFICIAL_ADJUSTED_PREVIOUS').length;
 document.getElementById('marginAsOf').textContent=`資料日 ${body.as_of}；上市價格 ${body.markets.TAIEX.coverage.price_observations} 日、融資 ${body.markets.TAIEX.coverage.money_observations} 日；上櫃價格 ${body.markets.TPEx.coverage.price_observations} 日、融資 ${body.markets.TPEx.coverage.money_observations} 日。${adjustedDays?`其中上櫃 ${adjustedDays} 日採後一報表的調整前日餘額，查看日期可辨識。`:''}缺日保持斷線；缺少當日融資時餘額卡顯示待資料，不沿用前一天。`;
 mountFixed(body);
}
