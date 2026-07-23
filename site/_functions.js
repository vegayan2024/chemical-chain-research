function getFiltered(){return currentCat==='全部'?DATA:DATA.filter(function(x){return x.cat===currentCat})}
function profitFmt(v){if(v==null||v==='')return'—';var n=parseFloat(v);if(isNaN(n))return v;if(Math.abs(n)>=1)return n.toFixed(1)+'亿';return(n*10000).toFixed(0)+'万'}
function changeClass(v){if(!v)return'';return String(v).charAt(0)==='+'?'up':String(v).charAt(0)==='-'?'down':''}
function getCompanyData(cat,p2Key,endKey){var d=DATA.filter(function(x){return x.cat===cat});if(p2Key)d=d.filter(function(x){return x.p2===p2Key});else if(endKey)d=d.filter(function(x){return x.end===endKey});return d.sort(function(a,b){return a.rank-b.rank})}
function getEcharts(){return window.echarts}

function renderPricesPage(el){
  var catProducts={
    '氟化工':[
      {name:'萤石(精粉)',key:'萤石',unit:'元/吨'},
      {name:'无水氢氟酸(AHF)',key:'AHF',unit:'元/吨'},
      {name:'R32(三代制冷剂)',key:'R32',unit:'元/吨'},
      {name:'R134a(汽车空调)',key:'R134a',unit:'元/吨'},
      {name:'PTFE(悬浮中粒)',key:'PTFE',unit:'元/吨'},
      {name:'PVDF(粉料)',key:'PVDF',unit:'元/吨'},
      {name:'六氟磷酸锂(LiPF6)',key:'六氟磷酸锂',unit:'万元/吨'}
    ],
    '磷化工':[
      {name:'磷矿石(30%品位)',key:'磷矿石',unit:'元/吨'},
      {name:'磷酸一铵(MAP)',key:'MAP',unit:'元/吨'},
      {name:'磷酸二铵(DAP)',key:'DAP',unit:'元/吨'},
      {name:'草甘膦(原药)',key:'草甘膦',unit:'元/吨'},
      {name:'磷酸铁锂(LFP)',key:'磷酸铁锂',unit:'万元/吨'}
    ]
  };
  var html='<div class="detail-inner">';
  html+='<div style="font-size:18px;font-weight:700;margin-bottom:4px">商品价格走势</div>';
  html+='<div style="font-size:11px;color:var(--dim);margin-bottom:20px">按化工分类展示主要产品3年月度价格（2023.01 - 2025.12）</div>';
  
  Object.keys(catProducts).forEach(function(cat){
    html+='<div style="font-size:15px;font-weight:600;color:var(--accent);margin:20px 0 12px;padding-bottom:8px;border-bottom:1px solid var(--border)">'+cat+'</div>';
    html+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(450px,1fr));gap:16px">';
    catProducts[cat].forEach(function(p){
      var pd=PRICE_DATA[p.key];
      if(!pd)return;
      // Get latest price and change
      var latest=pd.data[pd.data.length-1];
      var prev=pd.data[pd.data.length-13]; // 1 year ago
      var change=((latest-prev)/prev*100).toFixed(1);
      var changeStr=change>=0?'+'+change+'%':change+'%';
      var changeClass=change>=0?'up':'down';
      
      html+='<div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:16px">';
      html+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">';
      html+='<div><div style="font-size:13px;font-weight:600">'+p.name+'</div>';
      html+='<div style="font-size:10px;color:var(--dim)">'+pd.unit+'</div></div>';
      html+='<div style="text-align:right"><div style="font-size:16px;font-weight:700;color:var(--accent)">'+latest.toLocaleString()+'</div>';
      html+='<div style="font-size:11px;font-weight:600" class="'+changeClass+'">年涨跌 '+changeStr+'</div></div>';
      html+='</div>';
      html+='<div id="priceChart_'+p.key.replace(/[^a-zA-Z0-9]/g,'_')+'" style="width:100%;height:180px"></div>';
      html+='</div>';
    });
    html+='</div>';
  });
  
  html+='</div>';
  el.innerHTML=html;
  
  // Render charts
  setTimeout(function(){
    Object.keys(catProducts).forEach(function(cat){
      catProducts[cat].forEach(function(p){
        var pd=PRICE_DATA[p.key];
        if(pd)renderMiniPriceChart('priceChart_'+p.key.replace(/[^a-zA-Z0-9]/g,'_'),p.key,pd);
      });
    });
  },100);
}

function renderForecastTab(c){
  var fc=FORECAST_2026[c.name];
  if(!fc)return '<div style="color:var(--dim);padding:40px;text-align:center">暂无预测数据</div>';
  
  var html='<div class="section-title">2026年全年业绩预测</div>';
  html+='<div class="section-sub">基于最新商品价格 + 券商一致预期 + 敏感性分析</div>';
  
  // Forecast cards
  html+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px">';
  var scenarios=[
    {key:'pessimistic',label:'悲观',color:'var(--green)',icon:'🔻'},
    {key:'neutral',label:'中性',color:'var(--accent)',icon:'➖'},
    {key:'optimistic',label:'乐观',color:'var(--red)',icon:'🔺'}
  ];
  scenarios.forEach(function(s){
    var f=fc.forecast[s.key];
    var profitChg=((f.profit-fc.base.profit)/fc.base.profit*100).toFixed(0);
    html+='<div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:16px;border-top:3px solid '+s.color+'">';
    html+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:10px"><span>'+s.icon+'</span><span style="font-size:13px;font-weight:600;color:'+s.color+'">'+s.label+'情景</span></div>';
    html+='<div style="font-size:10px;color:var(--dim);margin-bottom:8px">'+f.note+'</div>';
    html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
    html+='<div><div style="font-size:9px;color:var(--dim)">营收预测</div><div style="font-size:16px;font-weight:700">'+f.rev+'亿</div></div>';
    html+='<div><div style="font-size:9px;color:var(--dim)">净利预测</div><div style="font-size:16px;font-weight:700;color:'+s.color+'">'+f.profit+'亿</div></div>';
    html+='<div><div style="font-size:9px;color:var(--dim)">同比增速</div><div style="font-size:14px;font-weight:600" class="'+(profitChg>=0?'up':'down')+'">'+(profitChg>=0?'+':'')+profitChg+'%</div></div>';
    html+='<div><div style="font-size:9px;color:var(--dim)">毛利率</div><div style="font-size:14px">'+f.gm+'%</div></div>';
    html+='<div><div style="font-size:9px;color:var(--dim)">EPS</div><div style="font-size:14px">'+f.eps+'元</div></div>';
    html+='<div><div style="font-size:9px;color:var(--dim)">基准净利</div><div style="font-size:14px;color:var(--dim)">'+fc.base.profit+'亿(2025)</div></div>';
    html+='</div></div>';
  });
  html+='</div>';
  
  // PE Valuation Calculator
  html+='<div class="section-title">PE估值计算器</div>';
  html+='<div class="section-sub">调整PE倍数，计算三档利润对应的估值和涨跌空间</div>';
  html+='<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">';
  html+='<span style="font-size:12px;color:var(--muted)">设定PE倍数：</span>';
  html+='<input type="range" id="peSlider" min="5" max="40" value="'+fc.defaultPE+'" style="flex:1;accent-color:var(--accent)" oninput="updatePEValuation()">';
  html+='<span id="peValue" style="font-size:18px;font-weight:700;color:var(--accent);min-width:40px">'+fc.defaultPE+'x</span>';
  html+='<span style="font-size:10px;color:var(--dim)">当前PE: '+fc.defaultPE+'x</span>';
  html+='</div>';
  
  // Valuation table
  html+='<table class="data-table" id="valuationTable"><thead><tr>';
  html+='<th>情景</th><th>净利(亿)</th><th>PE倍数</th><th>预测市值(亿)</th><th>当前市值(亿)</th><th>涨跌空间</th></tr></thead><tbody id="valuationBody">';
  html+='</tbody></table>';
  
  // Store data for JS calculation
  
  // Sensitivity analysis
  html+='<div class="section-title" style="margin-top:24px">产品价格敏感性分析</div>';
  html+='<div class="section-sub">产品价格每变动10%，对公司归母净利润的影响幅度</div>';
  html+='<table class="data-table"><thead><tr><th>产品</th><th>当前价格</th><th>价格变动</th><th>利润变动</th><th>弹性系数</th><th>传导机制</th></tr></thead><tbody>';
  fc.sensitivity.forEach(function(s){
    var priceClass=s.priceChange.startsWith('+')?'up':'down';
    var profitClass=s.profitChange.startsWith('+')?'up':'down';
    html+='<tr>';
    html+='<td style="font-weight:600">'+s.product+'</td>';
    var lp=fc.latestPrice[s.product];
    html+='<td style="color:var(--accent)">'+(lp?lp.toLocaleString()+'元/吨':'—')+'</td>';
    html+='<td class="'+priceClass+'">'+s.priceChange+'</td>';
    html+='<td class="'+profitClass+'" style="font-weight:600">'+s.profitChange+'</td>';
    html+='<td style="color:'+(s.elasticity>=2?'var(--red)':s.elasticity>=1?'var(--accent)':'var(--dim)')+';font-weight:700">'+s.elasticity+'x</td>';
    html+='<td style="font-size:10px;color:var(--dim);max-width:300px">'+s.mechanism+'</td>';
    html+='</tr>';
  });
  html+='</tbody></table>';
  
  // Elasticity explanation
  html+='<div style="margin-top:16px;padding:12px;background:var(--card);border:1px solid var(--border);border-radius:6px">';
  html+='<div style="font-size:11px;font-weight:600;color:var(--accent);margin-bottom:6px">📊 弹性系数解读</div>';
  html+='<div style="font-size:10px;color:var(--muted);line-height:1.6">';
  html+='• <b style="color:var(--red)">弹性>2x</b>：高敏感，价格小幅变动即大幅影响利润<br>';
  html+='• <b style="color:var(--accent)">弹性1-2x</b>：中等敏感<br>';
  html+='• <b style="color:var(--dim)">弹性<1x</b>：低敏感，该产品对整体利润影响有限';
  html+='</div></div>';
  
  // Trigger initial calculation
  
  return html;
}

function updatePEValuation(){
  var slider=document.getElementById('peSlider');
  var peDisplay=document.getElementById('peValue');
  var body=document.getElementById('valuationBody');
  if(!slider||!window._fcData)return;
  
  var pe=parseInt(slider.value);
  peDisplay.textContent=pe+'x';
  
  var fc=window._fcData;
  var scenarios=[
    {key:'pessimistic',label:'悲观',color:'var(--green)'},
    {key:'neutral',label:'中性',color:'var(--accent)'},
    {key:'optimistic',label:'乐观',color:'var(--red)'}
  ];
  
  var rows='';
  scenarios.forEach(function(s){
    var f=fc.forecast[s.key];
    var predictedMktCap=(f.profit*pe).toFixed(0);
    var upside=((predictedMktCap-fc.mktCap)/fc.mktCap*100).toFixed(1);
    var upClass=upside>=0?'up':'down';
    rows+='<tr>';
    rows+='<td style="font-weight:600;color:'+s.color+'">'+s.label+'</td>';
    rows+='<td>'+f.profit+'</td>';
    rows+='<td>'+pe+'x</td>';
    rows+='<td style="font-weight:700;color:var(--accent)">'+Number(predictedMktCap).toLocaleString()+'亿</td>';
    rows+='<td>'+fc.mktCap+'亿</td>';
    rows+='<td class="'+upClass+'" style="font-weight:700;font-size:14px">'+(upside>=0?'+':'')+upside+'%</td>';
    rows+='</tr>';
  });
  body.innerHTML=rows;
}


function renderCatFilters(){document.getElementById('catFilters').innerHTML=categories.map(function(c){return '<div class="cat-btn '+(c===currentCat?'active':'')+'" onclick="setCat(\''+c+'\')">'+c+'</div>'}).join('')}

function renderChainList(){var data=getFiltered();var groups={};data.forEach(function(d){var k=d.p1+(d.p2?' > '+d.p2:'');if(!groups[k])groups[k]=[];groups[k].push(d)});var el=document.getElementById('chainList');var h='';Object.keys(groups).forEach(function(k){var items=groups[k];var nk=items[0].p1+'|'+(items[0].p2||'');var cs=new Set(items.map(function(i){return i.aname||i.hname}));h+='<div class="chain-item" onclick="selectNode(\''+nk+'\')"><span class="chain-item-name">'+k+'</span><span class="chain-item-count">'+cs.size+'家</span></div>'});el.innerHTML=h||'<div style="padding:16px;color:#666">暂无</div>';var ac=new Set();data.forEach(function(d){if(d.aname)ac.add(d.aname);if(d.hname)ac.add(d.hname)});document.getElementById('statCompanies').textContent=ac.size;document.getElementById('statNodes').textContent=Object.keys(groups).length}

function renderCompanyPool(){var data=getFiltered();var seen=new Set();var cs=data.filter(function(d){var k=d.aname||d.hname;if(seen.has(k))return false;seen.add(k);return true});document.getElementById('companyPool').innerHTML=cs.map(function(d){var n=d.aname||d.hname;var c=d.aname?d.acode+'.SH':d.hcode+'.HK';return '<div class="pool-item" onclick="openCompany(\''+n+'\')"><div><div class="pool-name">'+n+'</div><div class="pool-code">'+c+'</div></div><div class="pool-metrics"><div class="pool-profit">'+profitFmt(d.profit)+'</div><div class="pool-change '+changeClass(d.profitChg)+'">'+(d.profitChg||'—')+'</div></div></div>'}).join('')}

function renderDetail(){var el=document.getElementById('detailPanel');if(view==='company'){renderCompanyPage(el);return}if(view==='prices'){renderPricesPage(el);return}if(!currentCat||currentCat==='全部'){el.innerHTML='<div class="empty-state"><div class="empty-icon">🏭</div><div>选择分类</div></div>';return}var tree=CHAIN_TREES[currentCat];if(!tree){el.innerHTML='<div class="empty-state">暂无数据</div>';return}var sections=Object.keys(tree);var html='<div class="detail-inner"><div style="font-size:16px;font-weight:700;margin-bottom:4px">'+currentCat+' 产业链全景图</div><div style="font-size:11px;color:#666;margin-bottom:16px">点击产品节点查看3年价格走势 · 点击公司进入详情页</div><div class="chain-flow">';sections.forEach(function(section,si){var nodes=tree[section];if(!nodes||!nodes.length)return;if(si>0)html+='<div class="chain-arrow-col"><div class="chain-arrow-line"></div><div class="chain-arrow-head"></div><div class="chain-arrow-line"></div></div>';var isUp=section.indexOf('上游')>=0;var isDown=section.indexOf('下游')>=0;var tagC=isUp?'tag-upstream':isDown?'tag-end':'tag-midstream';var tagL=isUp?'上游':isDown?'终端':'中游';html+='<div class="chain-col"><div class="chain-col-header">'+section+'</div>';nodes.forEach(function(node){var nk=currentCat+'|'+section+'|'+(node.key||node.end||node.name);var isExp=expandedNodes.has(nk);var hasSub=node.sub&&node.sub.length>0;var companies=[];if(node.key)companies=getCompanyData(currentCat,node.key,null);else if(node.end)companies=getCompanyData(currentCat,null,node.end);var priceKey='';Object.keys(PRICE_DATA).forEach(function(k){if(node.name.indexOf(k)>=0||k.indexOf(node.name)>=0)priceKey=k});html+='<div class="chain-node '+(isExp?'expanded':'')+'" onclick="toggleNode(\''+nk+'\','+hasSub+')">';html+='<div class="chain-node-name"><span class="tag '+tagC+'">'+tagL+'</span>'+node.name;if(priceKey)html+=' <span style="font-size:8px;color:#26c6da;cursor:pointer" onclick="event.stopPropagation();showPriceChart(\''+priceKey+'\')">📈</span>';html+='</div>';if(companies.length){html+='<div class="chain-node-companies">';companies.slice(0,5).forEach(function(d){var nm=d.aname||d.hname;html+='<span class="company-tag" onclick="event.stopPropagation();openCompany(\''+nm+'\')"><span class="rank-dot r'+d.rank+'"></span>'+nm+'</span>'});html+='</div>'}if(hasSub)html+='<div class="expand-hint">'+(isExp?'收起':'展开')+' '+node.sub.length+' 个子类</div>';if(isExp&&hasSub){html+='<div class="sub-nodes">';node.sub.forEach(function(sub){var sc=getCompanyData(currentCat,sub.key,null);var spk='';Object.keys(PRICE_DATA).forEach(function(k){if(sub.name.indexOf(k)>=0||k.indexOf(sub.name)>=0)spk=k});html+='<div class="sub-node" onclick="event.stopPropagation()"><div class="sub-node-name">'+sub.name;if(spk)html+=' <span style="font-size:8px;color:#26c6da;cursor:pointer" onclick="event.stopPropagation();showPriceChart(\''+spk+'\')">📈</span>';html+='</div>';if(sc.length){html+='<div class="sub-node-companies">';sc.slice(0,5).forEach(function(d){var nm=d.aname||d.hname;html+='<span class="company-tag" onclick="event.stopPropagation();openCompany(\''+nm+'\')"><span class="rank-dot r'+d.rank+'"></span>'+nm+'</span>'});html+='</div>'}html+='</div>'});html+='</div>'}html+='</div>'});html+='</div>'});html+='</div></div>';el.innerHTML=html;document.getElementById('statCurrent').textContent=currentCat}

function showPriceChart(key){var pd=PRICE_DATA[key];if(!pd)return;var old=document.getElementById('popupOverlay');if(old)old.remove();var overlay=document.createElement('div');overlay.id='popupOverlay';overlay.innerHTML='<div class="chart-popup-overlay" onclick="closePopup()"></div><div class="chart-popup"><button class="popup-close" onclick="closePopup()">✕</button><div style="font-size:14px;font-weight:600;margin-bottom:4px">'+key+' · 价格走势</div><div style="font-size:11px;color:#666;margin-bottom:12px">单位：'+pd.unit+' · 2023.01 - 2025.12 月度数据</div><div id="priceChartEl" style="width:100%;height:300px"></div></div>';document.body.appendChild(overlay);setTimeout(function(){var echarts=getEcharts();if(!echarts)return;var chart=echarts.init(document.getElementById('priceChartEl'),'dark');var months=[];for(var y=2023;y<=2025;y++)for(var m=1;m<=12;m++)months.push(y+'-'+String(m).padStart(2,'0'));chart.setOption({backgroundColor:'transparent',grid:{left:50,right:20,top:20,bottom:30},xAxis:{type:'category',data:months,axisLabel:{fontSize:9,color:'#666',interval:5},axisLine:{lineStyle:{color:'#333'}},axisTick:{show:false}},yAxis:{type:'value',axisLabel:{fontSize:9,color:'#666'},splitLine:{lineStyle:{color:'#2a2a2a'}},axisLine:{show:false}},series:[{type:'line',data:pd.data,smooth:true,lineStyle:{color:'#ffc107',width:2},areaStyle:{color:{type:'linear',x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:'rgba(255,193,7,.25)'},{offset:1,color:'rgba(255,193,7,.02)'}]}},symbol:'circle',symbolSize:4,itemStyle:{color:'#ffc107'}}],tooltip:{trigger:'axis',backgroundColor:'#2a2a2a',borderColor:'#3a3a3a',textStyle:{color:'#e0e0e0',fontSize:11}}})},100)}
function closePopup(){var el=document.getElementById('popupOverlay');if(el)el.remove()}

function openCompany(name){var cd=COMPANY_DETAIL[name];if(!cd)return;companyPage={name:name,code:cd.code,market:cd.market,ctrl:cd.ctrl,sector:cd.sector,summary:cd.summary,profitTrend:cd.profitTrend,quarterly:cd.quarterly,financials:cd.financials,capacities:cd.capacities,priceProducts:cd.priceProducts,topProductsByRev:cd.topProductsByRev||[],topProductsByProfit:cd.topProductsByProfit||[],q1_2026:cd.q1_2026||null};companyTab='overview';view='company';renderDetail()}
function goHome(){view='chain';companyPage=null;renderDetail();updateNavTabs('overview')}
function switchMainView(v){view=v;updateNavTabs(v);renderDetail()}
function updateNavTabs(v){
  var o=document.getElementById('navOverview');
  var p=document.getElementById('navPrices');
  if(o){o.className='nav-tab '+(v==='overview'||v==='chain'?'active':'')}
  if(p){p.className='nav-tab '+(v==='prices'?'active':'')}
}

function renderCompanyPage(el){var c=companyPage;if(!c)return;var html='<div class="company-header"><div><div class="company-header-name">'+c.name+' <span style="font-size:9px;padding:2px 6px;border-radius:2px;background:'+(c.market==='A'?'rgba(244,67,54,.15);color:#f44336':'rgba(76,175,80,.15);color:#4caf50')+'">'+c.market+'股</span>'+(c.q1_2026?'<span class="q1-badge">2026Q1</span>':'')+'</div><div class="company-header-code">'+c.code+' · '+c.ctrl+' · '+c.sector+'</div></div></div>';var tabs=[{key:'overview',label:'概览'},{key:'profit',label:'利润趋势'},{key:'quarterly',label:'季度明细'},{key:'financials',label:'财务指标'},{key:'capacity',label:'产能'},{key:'valuation',label:'估值'},{key:'products',label:'分产品'},{key:'prices',label:'商品价格'},{key:'forecast',label:'2026预测'}];html+='<div class="company-tabs">'+tabs.map(function(t){return '<div class="company-tab '+(companyTab===t.key?'active':'')+'" onclick="switchCompanyTab(\''+t.key+'\')">'+t.label+'</div>'}).join('')+'</div>';html+='<div style="padding:12px 24px 0"><div class="back-btn" onclick="goHome()">← 返回产业链图</div></div>';html+='<div class="company-section">';if(companyTab==='overview'){html+='<div class="section-title">公司摘要</div><div class="section-sub">'+c.summary+'</div>';if(c.q1_2026){html+='<div style="display:flex;gap:16px;margin-bottom:20px">';html+='<div class="val-card" style="flex:1"><div class="val-label">2026Q1 营收</div><div class="val-num" style="font-size:22px;color:var(--cyan)">'+c.q1_2026.rev+'亿</div></div>';html+='<div class="val-card" style="flex:1"><div class="val-label">2026Q1 净利</div><div class="val-num" style="font-size:22px;color:'+(c.q1_2026.profit>=0?'var(--red)':'var(--green)')+'">'+c.q1_2026.profit+'亿</div></div>';html+='<div class="val-card" style="flex:1"><div class="val-label">2026Q1 毛利率</div><div class="val-num" style="font-size:22px;color:var(--accent)">'+c.q1_2026.gm+'%</div></div>';html+='</div>'}html+='<div class="section-title">归母净利润趋势</div><div id="miniProfitChart" class="chart-container" style="height:220px"></div>';if(c.financials&&c.financials.length){html+='<div class="section-title">核心财务指标</div><table class="fin-table"><thead><tr><th>年份</th><th>营收(亿)</th><th>扣非净利(亿)</th><th>EPS</th><th>ROE</th><th>毛利率</th></tr></thead><tbody>';c.financials.slice(0,3).forEach(function(f){html+='<tr><td>'+f.year+'</td><td>'+f.rev+'</td><td>'+f.profit+'</td><td>'+f.eps+'</td><td>'+f.roe+'</td><td>'+f.gm+'</td></tr>'});html+='</tbody></table>'}if(c.capacities&&c.capacities.length){html+='<div class="section-title">产能概况</div><div class="capacity-grid">';c.capacities.forEach(function(cp){html+='<div class="capacity-card"><div class="capacity-card-name">'+cp.product+'</div><div class="capacity-card-cap">'+cp.cap+'</div><div class="capacity-card-rank">'+cp.rank+'</div></div>'});html+='</div>'}}else if(companyTab==='profit'){html+='<div class="section-title">归母净利润趋势</div><div id="profitChartFull" class="chart-container"></div>'}else if(companyTab==='quarterly'){html+='<div class="section-title">季度数据明细</div><div class="section-sub">归母净利润分季度拆分（亿元）</div>';if(c.quarterly){html+='<table class="fin-table"><thead><tr><th>报告期</th><th>年度总额</th><th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th></tr></thead><tbody>';c.quarterly.years.forEach(function(y,i){var total=(c.quarterly.q1[i]+c.quarterly.q2[i]+c.quarterly.q3[i]+c.quarterly.q4[i]).toFixed(1);html+='<tr><td>'+y+'</td><td>'+total+'</td><td>'+c.quarterly.q1[i].toFixed(1)+'</td><td>'+c.quarterly.q2[i].toFixed(1)+'</td><td>'+c.quarterly.q3[i].toFixed(1)+'</td><td>'+c.quarterly.q4[i].toFixed(1)+'</td></tr>'});html+='</tbody></table>'}html+='<div id="quarterlyChart" class="chart-container"></div>'}else if(companyTab==='financials'){html+='<div class="section-title">核心财务指标</div>';if(c.financials){html+='<table class="fin-table"><thead><tr><th>年份</th><th>营收(亿)</th><th>扣非净利(亿)</th><th>EPS</th><th>ROE</th><th>毛利率</th></tr></thead><tbody>';c.financials.forEach(function(f){html+='<tr><td>'+f.year+'</td><td>'+f.rev+'</td><td>'+f.profit+'</td><td>'+f.eps+'</td><td>'+f.roe+'</td><td>'+f.gm+'</td></tr>'});html+='</tbody></table>'}}else if(companyTab==='capacity'){html+='<div class="section-title">产能明细</div>';if(c.capacities){html+='<table class="data-table"><thead><tr><th>产品</th><th>产能</th><th>排名</th></tr></thead><tbody>';c.capacities.forEach(function(cp){html+='<tr><td style="font-weight:600">'+cp.product+'</td><td>'+cp.cap+'</td><td style="color:#ffc107">'+cp.rank+'</td></tr>'});html+='</tbody></table>'}}else if(companyTab==='valuation'){html+=renderValuationTab(c)}else if(companyTab==='products'){html+=renderProductsTab(c)}else if(companyTab==='forecast'){html+=renderForecastTab(c)}
  else if(companyTab==='prices'){html+='<div class="section-title">关联商品价格</div><div class="section-sub">点击商品查看3年走势</div>';if(c.priceProducts&&c.priceProducts.length){c.priceProducts.forEach(function(pk){var pd=PRICE_DATA[pk];if(!pd)return;html+='<div style="margin-bottom:20px"><div style="font-size:12px;font-weight:600;margin-bottom:8px">'+pk+' <span style="font-size:10px;color:#666">('+pd.unit+')</span></div><div id="priceChart_'+pk.replace(/[^a-zA-Z0-9]/g,'_')+'" style="width:100%;height:200px"></div></div>'})}else{html+='<div style="color:#666;padding:20px">暂无数据</div>'}}html+='</div>';el.innerHTML=html;setTimeout(function(){if(companyTab==='overview'&&c.profitTrend)renderProfitChart('miniProfitChart',c.profitTrend,true);else if(companyTab==='profit'&&c.profitTrend)renderProfitChart('profitChartFull',c.profitTrend,false);else if(companyTab==='quarterly'&&c.quarterly)renderQuarterlyChart('quarterlyChart',c.quarterly);else if(companyTab==='valuation')renderValuationCharts(c);else if(companyTab==='prices'&&c.priceProducts)c.priceProducts.forEach(function(pk){var pd=PRICE_DATA[pk];if(pd)renderMiniPriceChart('priceChart_'+pk.replace(/[^a-zA-Z0-9]/g,'_'),pk,pd)})},50)}

// ===== 估值 Tab =====
function renderValuationTab(c){
  var pePb=PE_PB_DATA[c.name];
  if(!pePb)return '<div style="color:#666;padding:40px;text-align:center">暂无估值数据</div>';
  var peVal=pePb.pe.values[pePb.pe.values.length-1];
  var pbVal=pePb.pb.values[pePb.pb.values.length-1];
  var pePctColor=pePb.pePct<=20?'var(--green)':pePb.pePct<=50?'var(--accent)':'var(--red)';
  var pbPctColor=pePb.pbPct<=20?'var(--green)':pePb.pbPct<=50?'var(--accent)':'var(--red)';
  var html='<div class="section-title">估值概览</div><div class="section-sub">PE/PB 3年季度数据 · 当前分位数</div>';
  html+='<div class="valuation-grid">';
  html+='<div class="val-card"><div class="val-label">PE(TTM)</div><div class="val-num" style="color:'+pePctColor+'">'+(peVal||'—')+'</div><div class="val-pct" style="color:'+pePctColor+'">分位数 '+pePb.pePct+'%</div><div class="val-range">3年区间: '+pePb.peRange+'</div></div>';
  html+='<div class="val-card"><div class="val-label">PB(MRQ)</div><div class="val-num" style="color:'+pbPctColor+'">'+(pbVal||'—')+'</div><div class="val-pct" style="color:'+pbPctColor+'">分位数 '+pePb.pbPct+'%</div><div class="val-range">3年区间: '+pePb.pbRange+'</div></div>';
  html+='</div>';
  html+='<div style="display:flex;gap:16px">';
  html+='<div style="flex:1"><div id="peChartEl" style="width:100%;height:260px"></div></div>';
  html+='<div style="flex:1"><div id="pbChartEl" style="width:100%;height:260px"></div></div>';
  html+='</div>';
  // 分位数条
  html+='<div style="margin-top:16px">';
  html+=renderPctBar('PE分位数',pePb.pePct,pePctColor);
  html+=renderPctBar('PB分位数',pePb.pbPct,pbPctColor);
  html+='</div>';
  return html;
}
function renderPctBar(label,pct,color){
  return '<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;margin-bottom:3px"><span style="font-size:11px;color:var(--muted)">'+label+'</span><span style="font-size:11px;font-weight:600;color:'+color+'">'+pct+'%</span></div><div style="width:100%;height:8px;background:var(--card);border-radius:4px;overflow:hidden"><div style="width:'+pct+'%;height:100%;background:'+color+';border-radius:4px;transition:width .5s"></div></div></div>';
}
function renderValuationCharts(c){
  var pePb=PE_PB_DATA[c.name];
  if(!pePb||!getEcharts())return;
  // PE chart
  var peChart=getEcharts().init(document.getElementById('peChartEl'),'dark');
  peChart.setOption({backgroundColor:'transparent',title:{text:'PE(TTM)走势',textStyle:{color:'#e0e0e0',fontSize:13},left:'center',top:5},grid:{left:50,right:20,top:40,bottom:30},xAxis:{type:'category',data:pePb.pe.quarters,axisLabel:{fontSize:9,color:'#666',rotate:45},axisLine:{lineStyle:{color:'#333'}},axisTick:{show:false}},yAxis:{type:'value',axisLabel:{fontSize:9,color:'#666'},splitLine:{lineStyle:{color:'#2a2a2a'}},axisLine:{show:false}},series:[{type:'line',data:pePb.pe.values.map(function(v){return v===null||v==='-'?null:v}),smooth:true,lineStyle:{color:'#f44336',width:2},areaStyle:{color:{type:'linear',x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:'rgba(244,67,54,.2)'},{offset:1,color:'rgba(244,67,54,.01)'}]}},symbol:'circle',symbolSize:5,itemStyle:{color:'#f44336'},connectNulls:true}],tooltip:{trigger:'axis',backgroundColor:'#2a2a2a',borderColor:'#3a3a3a',textStyle:{color:'#e0e0e0',fontSize:11}}});
  // PB chart
  var pbChart=getEcharts().init(document.getElementById('pbChartEl'),'dark');
  pbChart.setOption({backgroundColor:'transparent',title:{text:'PB(MRQ)走势',textStyle:{color:'#e0e0e0',fontSize:13},left:'center',top:5},grid:{left:50,right:20,top:40,bottom:30},xAxis:{type:'category',data:pePb.pb.quarters,axisLabel:{fontSize:9,color:'#666',rotate:45},axisLine:{lineStyle:{color:'#333'}},axisTick:{show:false}},yAxis:{type:'value',axisLabel:{fontSize:9,color:'#666'},splitLine:{lineStyle:{color:'#2a2a2a'}},axisLine:{show:false}},series:[{type:'line',data:pePb.pb.values,smooth:true,lineStyle:{color:'#42a5f5',width:2},areaStyle:{color:{type:'linear',x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:'rgba(66,165,245,.2)'},{offset:1,color:'rgba(66,165,245,.01)'}]}},symbol:'circle',symbolSize:5,itemStyle:{color:'#42a5f5'}}],tooltip:{trigger:'axis',backgroundColor:'#2a2a2a',borderColor:'#3a3a3a',textStyle:{color:'#e0e0e0',fontSize:11}}});
}

// ===== 分产品 Tab =====
function renderProductsTab(c){
  var html='';
  if(c.topProductsByRev&&c.topProductsByRev.length){
    html+='<div class="section-title">按收入排名前五产品（2025年报）</div><div class="section-sub">营收占比 · 毛利率 · 利润占比</div>';
    html+='<table class="product-table"><thead><tr><th>产品</th><th>营收(亿)</th><th>营收占比</th><th>毛利率</th><th>利润(亿)</th><th>利润占比</th></tr></thead><tbody>';
    c.topProductsByRev.forEach(function(p){
      var revBarW=Math.round(p.revPct*2);
      html+='<tr><td>'+p.name+'</td><td>'+p.rev.toFixed(2)+'</td><td><span class="pct-bar rev" style="width:'+Math.min(revBarW,200)+'px"></span>'+p.revPct.toFixed(1)+'%</td><td>'+p.gm.toFixed(1)+'%</td><td>'+p.profit.toFixed(2)+'</td><td>'+p.profitPct.toFixed(1)+'%</td></tr>';
    });
    html+='</tbody></table>';
  }
  if(c.topProductsByProfit&&c.topProductsByProfit.length){
    html+='<div class="section-title">按利润排名前五产品（2025年报）</div><div class="section-sub">利润占比 · 毛利率 · 营收</div>';
    html+='<table class="product-table"><thead><tr><th>产品</th><th>利润(亿)</th><th>利润占比</th><th>毛利率</th><th>营收(亿)</th></tr></thead><tbody>';
    c.topProductsByProfit.forEach(function(p){
      var profBarW=Math.round(p.profitPct*2);
      html+='<tr><td>'+p.name+'</td><td>'+p.profit.toFixed(2)+'</td><td><span class="pct-bar profit" style="width:'+Math.min(profBarW,200)+'px"></span>'+p.profitPct.toFixed(1)+'%</td><td>'+p.gm.toFixed(1)+'%</td><td>'+p.rev.toFixed(2)+'</td></tr>';
    });
    html+='</tbody></table>';
  }
  if(!html)html='<div style="color:#666;padding:40px;text-align:center">暂无分产品数据</div>';
  return html;
}

function switchCompanyTab(tab){companyTab=tab;renderDetail()}

function renderProfitChart(elId,trend,mini){var el=document.getElementById(elId);if(!el)return;var echarts=getEcharts();if(!echarts)return;var chart=echarts.init(el,'dark');chart.setOption({backgroundColor:'transparent',grid:{left:50,right:20,top:20,bottom:30},xAxis:{type:'category',data:trend.years.map(String),axisLabel:{fontSize:10,color:'#666'},axisLine:{lineStyle:{color:'#333'}},axisTick:{show:false}},yAxis:{type:'value',axisLabel:{fontSize:9,color:'#666'},splitLine:{lineStyle:{color:'#2a2a2a'}},axisLine:{show:false}},series:[{type:'bar',data:trend.values.map(function(v){return{value:v,itemStyle:{color:v>=0?'#f44336':'#4caf50'}}}),barWidth:mini?20:30,label:{show:!mini,position:'top',fontSize:10,color:'#e0e0e0',formatter:function(p){return p.value+'亿'}}}],tooltip:{trigger:'axis',backgroundColor:'#2a2a2a',borderColor:'#3a3a3a',textStyle:{color:'#e0e0e0',fontSize:11}}})
}
function renderQuarterlyChart(elId,q){var el=document.getElementById(elId);if(!el)return;var echarts=getEcharts();if(!echarts)return;var chart=echarts.init(el,'dark');var series=['Q1','Q2','Q3','Q4'].map(function(qi,i){return{name:qi,type:'bar',data:q['q'+(i+1)],barWidth:15}});chart.setOption({backgroundColor:'transparent',grid:{left:50,right:20,top:40,bottom:30},legend:{data:['Q1','Q2','Q3','Q4'],textStyle:{color:'#666',fontSize:10},top:0},xAxis:{type:'category',data:q.years.map(String),axisLabel:{fontSize:10,color:'#666'},axisLine:{lineStyle:{color:'#333'}}},yAxis:{type:'value',axisLabel:{fontSize:9,color:'#666'},splitLine:{lineStyle:{color:'#2a2a2a'}}},series:series,tooltip:{trigger:'axis',backgroundColor:'#2a2a2a',borderColor:'#3a3a3a',textStyle:{color:'#e0e0e0',fontSize:11}}})
}
function renderMiniPriceChart(elId,key,pd){var el=document.getElementById(elId);if(!el)return;var echarts=getEcharts();if(!echarts)return;var chart=echarts.init(el,'dark');var months=[];for(var y=2023;y<=2025;y++)for(var m=1;m<=12;m++)months.push(y+'-'+String(m).padStart(2,'0'));chart.setOption({backgroundColor:'transparent',grid:{left:60,right:20,top:10,bottom:25},xAxis:{type:'category',data:months,axisLabel:{fontSize:8,color:'#666',interval:5},axisLine:{lineStyle:{color:'#333'}},axisTick:{show:false}},yAxis:{type:'value',axisLabel:{fontSize:8,color:'#666'},splitLine:{lineStyle:{color:'#2a2a2a'}},axisLine:{show:false}},series:[{type:'line',data:pd.data,smooth:true,lineStyle:{color:'#ffc107',width:1.5},areaStyle:{color:{type:'linear',x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:'rgba(255,193,7,.15)'},{offset:1,color:'rgba(255,193,7,.01)'}]}},symbol:'none'}],tooltip:{trigger:'axis',backgroundColor:'#2a2a2a',borderColor:'#3a3a3a',textStyle:{color:'#e0e0e0',fontSize:10}}})
}
function toggleNode(key,hasSub){if(hasSub){if(expandedNodes.has(key))expandedNodes.delete(key);else expandedNodes.add(key);renderDetail()}}
function selectNode(key){renderChainList()}
function setCat(cat){currentCat=cat;expandedNodes.clear();view='chain';companyPage=null;renderCatFilters();renderChainList();renderCompanyPool();renderDetail()}

document.getElementById('globalSearch').addEventListener('input',function(e){var q=e.target.value.toLowerCase();if(!q){setCat(currentCat);return}var filtered=DATA.filter(function(d){return(d.cat+d.p1+d.p2+d.end+d.app+d.aname+d.hname).toLowerCase().indexOf(q)>=0});var groups={};filtered.forEach(function(d){var k=d.p1+(d.p2?' > '+d.p2:'');if(!groups[k])groups[k]=[];groups[k].push(d)});document.getElementById('chainList').innerHTML=Object.keys(groups).map(function(k){var items=groups[k];return '<div class="chain-item" onclick="selectNode(\''+items[0].p1+'|'+(items[0].p2||'')+'\')"><span class="chain-item-name">'+k+'</span><span class="chain-item-count">'+new Set(items.map(function(i){return i.aname||i.hname})).size+'家</span></div>'}).join('')||'<div style="padding:16px;color:#666">无匹配</div>'});
document.addEventListener('keydown',function(e){if(e.key==='Escape')closePopup()});

renderCatFilters();renderChainList();renderCompanyPool();renderDetail();
try {
  console.log('About to call renderCatFilters');
  renderCatFilters();
  console.log('renderCatFilters done');
  renderChainList();
  console.log('renderChainList done');
  renderCompanyPool();
  console.log('renderCompanyPool done');
  renderDetail();
  console.log('renderDetail done');
} catch(e) {
  console.log('Error:', e.message);
  console.log('Stack:', e.stack);
}

renderCatFilters();renderChainList();renderCompanyPool();renderDetail();
