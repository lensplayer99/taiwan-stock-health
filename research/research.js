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
  if(!hash||hash==='#')return {page:'home',id:null,hash:'#home',valid:true};
  if(['#home','#market','#stocks'].includes(hash))return {page:hash.slice(1),id:null,hash,valid:true};
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
const researchStates={accumulating_local_peak:'上升段延續',major_local_correction:'修正觀察中'};
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
    if(changed&&['home','stocks'].includes(route.page)){rankingVisible={TWSE:RANKING_PAGE_SIZE,TPEX:RANKING_PAGE_SIZE};paintRanking();}
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
  loadBuild();
}
if(typeof document!=='undefined')init();

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
