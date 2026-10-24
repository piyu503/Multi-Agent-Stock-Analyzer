/**
 * EquiAgentic NSE Bridge using stock-nse-india
 * 
 * Fetches:
 * 1. Security-wise Delivery Position (delivery %, quantity, traded volume)
 * 2. Order Book Depth (total buy quantity, total sell quantity, buy/sell ratio)
 * 3. Official NSE Announcements & Earnings/Board Meetings
 */

const { NseIndia } = require("stock-nse-india");

async function fetchNseMicrostructure(symbol) {
    if (!symbol) {
        console.log(JSON.stringify({ status: "error", error: "Missing symbol argument" }));
        process.exit(1);
    }

    const cleanSymbol = symbol.trim().toUpperCase().replace(".NS", "").replace(".BO", "");
    const nse = new NseIndia();

    try {
        const [tradeInfo, corpInfo] = await Promise.allSettled([
            nse.getEquityTradeInfo(cleanSymbol),
            nse.getEquityCorporateInfo(cleanSymbol)
        ]);

        const tradeData = tradeInfo.status === "fulfilled" ? tradeInfo.value : null;
        const corpData = corpInfo.status === "fulfilled" ? corpInfo.value : null;

        // 1. Delivery Position
        const secDP = tradeData?.securityWiseDP || {};
        const deliveryPct = typeof secDP.deliveryToTradedQuantity === "number" ? secDP.deliveryToTradedQuantity : null;
        const deliveryQty = secDP.deliveryQuantity || null;
        const tradedQty = secDP.quantityTraded || null;
        const delivDate = secDP.secWiseDelPosDate || null;

        // 2. Order Book Depth & Institutional Absorption
        const orderBook = tradeData?.marketDeptOrderBook || {};
        const totalBuy = orderBook.totalBuyQuantity || null;
        const totalSell = orderBook.totalSellQuantity || null;
        let buySellRatio = null;
        if (totalBuy && totalSell && totalSell > 0) {
            buySellRatio = Number((totalBuy / totalSell).toFixed(2));
        }

        // 3. Official NSE Announcements
        const rawAnnouncements = corpData?.latest_announcements?.data || [];
        const announcements = rawAnnouncements.slice(0, 6).map(item => ({
            headline: item.subject || "Exchange Notification",
            category: "NSE Statutory Filing",
            published: item.broadcastdate || "Recent",
            source: "NSE Official Disclosures",
            symbol: item.symbol || cleanSymbol
        }));

        // 4. Upcoming & Recent Board Meetings
        const rawBoardMeetings = corpData?.borad_meeting?.data || [];
        const boardMeetings = rawBoardMeetings.slice(0, 4).map(item => ({
            purpose: item.purpose || "Board Meeting",
            date: item.meetingdate || "Scheduled",
            symbol: item.symbol || cleanSymbol
        }));

        // 5. Corporate Actions (Dividends, Splits, Bonus)
        const rawActions = corpData?.corporate_actions?.data || [];
        const corporateActions = rawActions.slice(0, 4).map(item => ({
            purpose: item.purpose || "Corporate Action",
            ex_date: item.exdate || "N/A",
            record_date: item.recordDate || "N/A"
        }));

        const result = {
            status: "success",
            symbol: cleanSymbol,
            delivery_position: {
                delivery_pct: deliveryPct,
                delivery_qty: deliveryQty,
                traded_qty: tradedQty,
                date: delivDate
            },
            microstructure: {
                total_buy_qty: totalBuy,
                total_sell_qty: totalSell,
                buy_sell_ratio: buySellRatio
            },
            announcements,
            board_meetings: boardMeetings,
            corporate_actions: corporateActions
        };

        console.log(JSON.stringify(result));
    } catch (err) {
        console.log(JSON.stringify({
            status: "error",
            symbol: cleanSymbol,
            error: err.message || String(err)
        }));
    }
}

const targetSymbol = process.argv[2] || "TCS";
fetchNseMicrostructure(targetSymbol);
