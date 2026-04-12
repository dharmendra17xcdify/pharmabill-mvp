"use strict";(()=>{var a={};a.id=647,a.ids=[647],a.modules={261:a=>{a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:a=>{a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},19121:a=>{a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},29294:a=>{a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},44870:a=>{a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},51084:a=>{a.exports=require("mssql")},63033:a=>{a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},74556:(a,b,c)=>{c.d(b,{F$:()=>k,Ir:()=>g,LM:()=>j,Mc:()=>h,Ns:()=>i,WF:()=>l,gR:()=>e,r1:()=>f});var d=c(27143);async function e(a){let b=await (0,d.d_)(),c=(await b.request().query(`
      UPDATE app_meta
      SET value = CAST(CAST(value AS INT) + 1 AS NVARCHAR(10))
      OUTPUT INSERTED.value
      WHERE [key] = 'last_invoice_number'
    `)).recordset[0].value;return`${a}-${String(c).padStart(4,"0")}`}async function f(a,b){let c=await (0,d.d_)(),e=new d.ll.Transaction(c);await e.begin();try{let c=(await new d.ll.Request(e).input("bill_number",d.ll.NVarChar(50),a.bill_number).input("customer_name",d.ll.NVarChar(255),a.customer_name||"").input("customer_phone",d.ll.NVarChar(50),a.customer_phone||"").input("customer_address",d.ll.NVarChar(500),a.customer_address||"").input("doctor_name",d.ll.NVarChar(255),a.doctor_name||"").input("subtotal",d.ll.Decimal(10,2),a.subtotal).input("gst_total",d.ll.Decimal(10,2),a.gst_total).input("discount_percent",d.ll.Decimal(5,2),a.discount_percent??0).input("discount_total",d.ll.Decimal(10,2),a.discount_total).input("grand_total",d.ll.Decimal(10,2),a.grand_total).input("payment_mode",d.ll.NVarChar(20),a.payment_mode).input("created_at",d.ll.NVarChar(50),a.created_at).query(`
        INSERT INTO bills
          (bill_number, customer_name, customer_phone, customer_address, doctor_name, subtotal, gst_total, discount_percent, discount_total, grand_total, payment_mode, created_at)
        OUTPUT INSERTED.id
        VALUES
          (@bill_number, @customer_name, @customer_phone, @customer_address, @doctor_name, @subtotal, @gst_total, @discount_percent, @discount_total, @grand_total, @payment_mode, @created_at)
      `)).recordset[0].id;for(let a=0;a<b.length;a++){let f=b[a];await new d.ll.Request(e).input(`bill_id_${a}`,d.ll.Int,c).input(`medicine_id_${a}`,d.ll.Int,f.medicine_id).input(`medicine_name_${a}`,d.ll.NVarChar(255),f.medicine_name).input(`batch_no_${a}`,d.ll.NVarChar(100),f.batch_no||"").input(`hsn_${a}`,d.ll.NVarChar(50),f.hsn||"").input(`expiry_month_${a}`,d.ll.Int,f.expiry_month??null).input(`expiry_year_${a}`,d.ll.Int,f.expiry_year??null).input(`manufacture_name_${a}`,d.ll.NVarChar(255),f.manufacture_name||"").input(`is_loose_${a}`,d.ll.Bit,+!!f.is_loose).input(`qty_${a}`,d.ll.Int,f.qty).input(`unit_price_${a}`,d.ll.Decimal(10,2),f.unit_price).input(`gst_percent_${a}`,d.ll.Decimal(5,2),f.gst_percent).input(`gst_amount_${a}`,d.ll.Decimal(10,2),f.gst_amount).input(`line_total_${a}`,d.ll.Decimal(10,2),f.line_total).query(`
          INSERT INTO bill_items
            (bill_id, medicine_id, medicine_name, batch_no, hsn, expiry_month, expiry_year, manufacture_name, is_loose, qty, unit_price, gst_percent, gst_amount, line_total)
          VALUES
            (@bill_id_${a}, @medicine_id_${a}, @medicine_name_${a}, @batch_no_${a}, @hsn_${a}, @expiry_month_${a}, @expiry_year_${a}, @manufacture_name_${a}, @is_loose_${a}, @qty_${a}, @unit_price_${a}, @gst_percent_${a}, @gst_amount_${a}, @line_total_${a})
        `),f.is_loose||await new d.ll.Request(e).input(`sid_${a}`,d.ll.Int,f.medicine_id).input(`sqty_${a}`,d.ll.Int,f.qty).input(`sbn_${a}`,d.ll.NVarChar(100),f.batch_no||"").query(`
            UPDATE medicine_batches
            SET stock_qty = CASE WHEN stock_qty - @sqty_${a} < 0 THEN 0 ELSE stock_qty - @sqty_${a} END
            WHERE id = (
              SELECT TOP 1 id FROM medicine_batches
              WHERE medicine_id = @sid_${a}
                AND stock_qty > 0
                AND (
                  (@sbn_${a} <> '' AND batch_no = @sbn_${a})
                  OR (@sbn_${a} = '' AND 1 = 1)
                )
              ORDER BY
                CASE WHEN @sbn_${a} <> '' AND batch_no = @sbn_${a} THEN 0 ELSE 1 END,
                expiry_year  ASC,
                expiry_month ASC,
                id ASC
            )
          `)}return await e.commit(),c}catch(a){throw await e.rollback(),a}}async function g(){let a=await (0,d.d_)();return(await a.request().query("SELECT * FROM bills ORDER BY created_at DESC")).recordset}async function h(a){let b=await (0,d.d_)(),c=(await b.request().input("id",d.ll.Int,a).query("SELECT * FROM bills WHERE id = @id")).recordset[0]??null;if(!c)return null;let e=await b.request().input("bill_id",d.ll.Int,a).query("SELECT * FROM bill_items WHERE bill_id = @bill_id");return{...c,items:e.recordset}}async function i(a,b,c){let e=await (0,d.d_)(),f=new d.ll.Transaction(e);await f.begin();try{for(let b of(await new d.ll.Request(f).input("bill_id_r",d.ll.Int,a).query("SELECT medicine_id, qty, batch_no, is_loose FROM bill_items WHERE bill_id = @bill_id_r")).recordset){if(b.is_loose)continue;let a=(b.batch_no||"").trim();a?await new d.ll.Request(f).input("r_mid",d.ll.Int,b.medicine_id).input("r_qty",d.ll.Int,b.qty).input("r_bn",d.ll.NVarChar(100),a).query(`
            UPDATE medicine_batches
            SET stock_qty = stock_qty + @r_qty
            WHERE medicine_id = @r_mid AND batch_no = @r_bn
          `):await new d.ll.Request(f).input("r_mid2",d.ll.Int,b.medicine_id).input("r_qty2",d.ll.Int,b.qty).query(`
            UPDATE medicine_batches
            SET stock_qty = stock_qty + @r_qty2
            WHERE id = (
              SELECT TOP 1 id FROM medicine_batches
              WHERE medicine_id = @r_mid2
              ORDER BY expiry_year ASC, expiry_month ASC, id ASC
            )
          `)}await new d.ll.Request(f).input("bill_id_d",d.ll.Int,a).query("DELETE FROM bill_items WHERE bill_id = @bill_id_d"),await new d.ll.Request(f).input("id",d.ll.Int,a).input("customer_name",d.ll.NVarChar(255),b.customer_name||"").input("customer_phone",d.ll.NVarChar(50),b.customer_phone||"").input("customer_address",d.ll.NVarChar(500),b.customer_address||"").input("doctor_name",d.ll.NVarChar(255),b.doctor_name||"").input("subtotal",d.ll.Decimal(10,2),b.subtotal).input("gst_total",d.ll.Decimal(10,2),b.gst_total).input("discount_percent",d.ll.Decimal(5,2),b.discount_percent??0).input("discount_total",d.ll.Decimal(10,2),b.discount_total).input("grand_total",d.ll.Decimal(10,2),b.grand_total).input("payment_mode",d.ll.NVarChar(20),b.payment_mode).input("created_at",d.ll.NVarChar(50),b.created_at||"").query(`
        UPDATE bills SET
          customer_name = @customer_name, customer_phone = @customer_phone,
          customer_address = @customer_address, doctor_name = @doctor_name,
          subtotal = @subtotal, gst_total = @gst_total,
          discount_percent = @discount_percent, discount_total = @discount_total,
          grand_total = @grand_total, payment_mode = @payment_mode
          ${b.created_at?", created_at = @created_at":""}
        WHERE id = @id
      `);for(let b=0;b<c.length;b++){let e=c[b];await new d.ll.Request(f).input(`bill_id_${b}`,d.ll.Int,a).input(`medicine_id_${b}`,d.ll.Int,e.medicine_id).input(`medicine_name_${b}`,d.ll.NVarChar(255),e.medicine_name).input(`batch_no_${b}`,d.ll.NVarChar(100),e.batch_no||"").input(`hsn_${b}`,d.ll.NVarChar(50),e.hsn||"").input(`expiry_month_${b}`,d.ll.Int,e.expiry_month??null).input(`expiry_year_${b}`,d.ll.Int,e.expiry_year??null).input(`manufacture_name_${b}`,d.ll.NVarChar(255),e.manufacture_name||"").input(`is_loose_${b}`,d.ll.Bit,+!!e.is_loose).input(`qty_${b}`,d.ll.Int,e.qty).input(`unit_price_${b}`,d.ll.Decimal(10,2),e.unit_price).input(`gst_percent_${b}`,d.ll.Decimal(5,2),e.gst_percent).input(`gst_amount_${b}`,d.ll.Decimal(10,2),e.gst_amount).input(`line_total_${b}`,d.ll.Decimal(10,2),e.line_total).query(`
          INSERT INTO bill_items
            (bill_id, medicine_id, medicine_name, batch_no, hsn, expiry_month, expiry_year,
             manufacture_name, is_loose, qty, unit_price, gst_percent, gst_amount, line_total)
          VALUES
            (@bill_id_${b}, @medicine_id_${b}, @medicine_name_${b}, @batch_no_${b}, @hsn_${b},
             @expiry_month_${b}, @expiry_year_${b}, @manufacture_name_${b}, @is_loose_${b},
             @qty_${b}, @unit_price_${b}, @gst_percent_${b}, @gst_amount_${b}, @line_total_${b})
        `),e.is_loose||await new d.ll.Request(f).input(`sid_${b}`,d.ll.Int,e.medicine_id).input(`sqty_${b}`,d.ll.Int,e.qty).input(`sbn_${b}`,d.ll.NVarChar(100),e.batch_no||"").query(`
            UPDATE medicine_batches
            SET stock_qty = CASE WHEN stock_qty - @sqty_${b} < 0 THEN 0 ELSE stock_qty - @sqty_${b} END
            WHERE id = (
              SELECT TOP 1 id FROM medicine_batches
              WHERE medicine_id = @sid_${b}
                AND stock_qty > 0
                AND (
                  (@sbn_${b} <> '' AND batch_no = @sbn_${b})
                  OR (@sbn_${b} = '' AND 1 = 1)
                )
              ORDER BY
                CASE WHEN @sbn_${b} <> '' AND batch_no = @sbn_${b} THEN 0 ELSE 1 END,
                expiry_year  ASC,
                expiry_month ASC,
                id ASC
            )
          `)}await f.commit()}catch(a){throw await f.rollback(),a}}async function j(a){let b=await (0,d.d_)(),c=new d.ll.Transaction(b);await c.begin();try{for(let b of(await new d.ll.Request(c).input("bill_id_r",d.ll.Int,a).query("SELECT medicine_id, qty, batch_no, is_loose FROM bill_items WHERE bill_id = @bill_id_r")).recordset){if(b.is_loose)continue;let a=(b.batch_no||"").trim();a?await new d.ll.Request(c).input("r_mid",d.ll.Int,b.medicine_id).input("r_qty",d.ll.Int,b.qty).input("r_bn",d.ll.NVarChar(100),a).query(`
            UPDATE medicine_batches SET stock_qty = stock_qty + @r_qty
            WHERE medicine_id = @r_mid AND batch_no = @r_bn
          `):await new d.ll.Request(c).input("r_mid2",d.ll.Int,b.medicine_id).input("r_qty2",d.ll.Int,b.qty).query(`
            UPDATE medicine_batches SET stock_qty = stock_qty + @r_qty2
            WHERE id = (
              SELECT TOP 1 id FROM medicine_batches WHERE medicine_id = @r_mid2
              ORDER BY expiry_year ASC, expiry_month ASC, id ASC
            )
          `)}await new d.ll.Request(c).input("bill_id",d.ll.Int,a).query("DELETE FROM bill_items WHERE bill_id = @bill_id"),await new d.ll.Request(c).input("id",d.ll.Int,a).query("DELETE FROM bills WHERE id = @id"),await c.commit()}catch(a){throw await c.rollback(),a}}async function k(){let a=await (0,d.d_)(),b=new Date().toISOString().split("T")[0];return(await a.request().input("today",d.ll.NVarChar(20),`${b}%`).query(`
      SELECT COALESCE(SUM(grand_total), 0) AS total, COUNT(*) AS count
      FROM bills WHERE created_at LIKE @today
    `)).recordset[0]??{total:0,count:0}}async function l(){let a=await (0,d.d_)(),b=new Date().toISOString().substring(0,7);return(await a.request().input("month",d.ll.NVarChar(20),`${b}%`).query(`
      SELECT COALESCE(SUM(grand_total), 0) AS total, COUNT(*) AS count
      FROM bills WHERE created_at LIKE @month
    `)).recordset[0]??{total:0,count:0}}},86439:a=>{a.exports=require("next/dist/shared/lib/no-fallback-error.external")},93081:(a,b,c)=>{c.r(b),c.d(b,{handler:()=>D,patchFetch:()=>C,routeModule:()=>y,serverHooks:()=>B,workAsyncStorage:()=>z,workUnitAsyncStorage:()=>A});var d={};c.r(d),c.d(d,{GET:()=>x});var e=c(95736),f=c(9117),g=c(4044),h=c(39326),i=c(32324),j=c(261),k=c(54290),l=c(85328),m=c(38928),n=c(46595),o=c(3421),p=c(17679),q=c(41681),r=c(63446),s=c(86439),t=c(51356),u=c(10641),v=c(74556),w=c(17141);async function x(){try{let[a,b,c]=await Promise.all([(0,v.F$)(),(0,v.WF)(),(0,w.N7)()]),d=c.filter(a=>a.stock_qty<=5);return u.NextResponse.json({today:a,month:b,lowStockCount:d.length,lowStockMedicines:d})}catch(a){return console.error("GET /api/reports",a),u.NextResponse.json({error:"Failed to load reports"},{status:500})}}let y=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/reports/route",pathname:"/api/reports",filename:"route",bundlePath:"app/api/reports/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"D:\\pharmabill-mvp\\web\\app\\api\\reports\\route.ts",nextConfigOutput:"standalone",userland:d}),{workAsyncStorage:z,workUnitAsyncStorage:A,serverHooks:B}=y;function C(){return(0,g.patchFetch)({workAsyncStorage:z,workUnitAsyncStorage:A})}async function D(a,b,c){var d;let e="/api/reports/route";"/index"===e&&(e="/");let g=await y.prepare(a,b,{srcPage:e,multiZoneDraftMode:!1});if(!g)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:u,params:v,nextConfig:w,isDraftMode:x,prerenderManifest:z,routerServerContext:A,isOnDemandRevalidate:B,revalidateOnlyGenerated:C,resolvedPathname:D}=g,E=(0,j.normalizeAppPath)(e),F=!!(z.dynamicRoutes[E]||z.routes[D]);if(F&&!x){let a=!!z.routes[D],b=z.dynamicRoutes[E];if(b&&!1===b.fallback&&!a)throw new s.NoFallbackError}let G=null;!F||y.isDev||x||(G="/index"===(G=D)?"/":G);let H=!0===y.isDev||!F,I=F&&!H,J=a.method||"GET",K=(0,i.getTracer)(),L=K.getActiveScopeSpan(),M={params:v,prerenderManifest:z,renderOpts:{experimental:{cacheComponents:!!w.experimental.cacheComponents,authInterrupts:!!w.experimental.authInterrupts},supportsDynamicResponse:H,incrementalCache:(0,h.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:null==(d=w.experimental)?void 0:d.cacheLife,isRevalidate:I,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d)=>y.onRequestError(a,b,d,A)},sharedContext:{buildId:u}},N=new k.NodeNextRequest(a),O=new k.NodeNextResponse(b),P=l.NextRequestAdapter.fromNodeNextRequest(N,(0,l.signalFromNodeResponse)(b));try{let d=async c=>y.handle(P,M).finally(()=>{if(!c)return;c.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let d=K.getRootSpanAttributes();if(!d)return;if(d.get("next.span_type")!==m.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${d.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=d.get("next.route");if(e){let a=`${J} ${e}`;c.setAttributes({"next.route":e,"http.route":e,"next.span_name":a}),c.updateName(a)}else c.updateName(`${J} ${a.url}`)}),g=async g=>{var i,j;let k=async({previousCacheEntry:f})=>{try{if(!(0,h.getRequestMeta)(a,"minimalMode")&&B&&C&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let e=await d(g);a.fetchMetrics=M.renderOpts.fetchMetrics;let i=M.renderOpts.pendingWaitUntil;i&&c.waitUntil&&(c.waitUntil(i),i=void 0);let j=M.renderOpts.collectedTags;if(!F)return await (0,o.I)(N,O,e,M.renderOpts.pendingWaitUntil),null;{let a=await e.blob(),b=(0,p.toNodeOutgoingHttpHeaders)(e.headers);j&&(b[r.NEXT_CACHE_TAGS_HEADER]=j),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==M.renderOpts.collectedRevalidate&&!(M.renderOpts.collectedRevalidate>=r.INFINITE_CACHE)&&M.renderOpts.collectedRevalidate,d=void 0===M.renderOpts.collectedExpire||M.renderOpts.collectedExpire>=r.INFINITE_CACHE?void 0:M.renderOpts.collectedExpire;return{value:{kind:t.CachedRouteKind.APP_ROUTE,status:e.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:d}}}}catch(b){throw(null==f?void 0:f.isStale)&&await y.onRequestError(a,b,{routerKind:"App Router",routePath:e,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:B})},A),b}},l=await y.handleResponse({req:a,nextConfig:w,cacheKey:G,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:z,isRoutePPREnabled:!1,isOnDemandRevalidate:B,revalidateOnlyGenerated:C,responseGenerator:k,waitUntil:c.waitUntil});if(!F)return null;if((null==l||null==(i=l.value)?void 0:i.kind)!==t.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==l||null==(j=l.value)?void 0:j.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});(0,h.getRequestMeta)(a,"minimalMode")||b.setHeader("x-nextjs-cache",B?"REVALIDATED":l.isMiss?"MISS":l.isStale?"STALE":"HIT"),x&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let m=(0,p.fromNodeOutgoingHttpHeaders)(l.value.headers);return(0,h.getRequestMeta)(a,"minimalMode")&&F||m.delete(r.NEXT_CACHE_TAGS_HEADER),!l.cacheControl||b.getHeader("Cache-Control")||m.get("Cache-Control")||m.set("Cache-Control",(0,q.getCacheControlHeader)(l.cacheControl)),await (0,o.I)(N,O,new Response(l.value.body,{headers:m,status:l.value.status||200})),null};L?await g(L):await K.withPropagatedContext(a.headers,()=>K.trace(m.BaseServerSpan.handleRequest,{spanName:`${J} ${a.url}`,kind:i.SpanKind.SERVER,attributes:{"http.method":J,"http.target":a.url}},g))}catch(b){if(b instanceof s.NoFallbackError||await y.onRequestError(a,b,{routerKind:"App Router",routePath:E,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:B})}),F)throw b;return await (0,o.I)(N,O,new Response(null,{status:500})),null}}}};var b=require("../../../webpack-runtime.js");b.C(a);var c=b.X(0,[1331,1692,2785],()=>b(b.s=93081));module.exports=c})();