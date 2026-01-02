const { Sale, SaleItem, ServiceInward, ServiceInvoice, ServiceItem, Inventory, Item, sequelize } = require('../models');
const { Op } = require('sequelize');

class ReportController {
    static async getProfitReport(req, res) {
        try {
            const { fromDate, toDate } = req.query;

            const whereClause = {};
            if (fromDate && toDate) {
                whereClause.createdAt = {
                    [Op.between]: [fromDate + ' 00:00:00', toDate + ' 23:59:59']
                };
            }

            // 1. Fetch Sales with Costs
            const sales = await Sale.findAll({
                where: whereClause,
                include: [{
                    model: SaleItem,
                    as: 'items',
                    include: [{
                        model: Inventory,
                        as: 'inventory',
                        attributes: ['inwardPrice']
                    }]
                }]
            });

            const salesReport = sales.map(sale => {
                let saleCost = 0;
                sale.items.forEach(item => {
                    const cost = parseFloat(item.inventory?.inwardPrice || 0);
                    saleCost += cost * item.quantity;
                });

                return {
                    id: sale.id,
                    invoiceNo: `SAL/${sale.id.toString().padStart(4, '0')}`,
                    date: sale.invoiceDate || sale.createdAt,
                    customer: sale.customerName,
                    revenue: parseFloat(sale.totalAmount),
                    cost: saleCost,
                    profit: parseFloat(sale.totalAmount) - saleCost,
                    type: 'SALE'
                };
            });

            // 2. Fetch Service Invoices with costs
            const serviceInvoices = await ServiceInvoice.findAll({
                where: whereClause,
                include: [
                    {
                        model: ServiceInward,
                        as: 'inward',
                        attributes: ['customerName', 'inwardNo']
                    },
                    {
                        model: ServiceItem,
                        as: 'items',
                        include: [{
                            model: Inventory,
                            as: 'inventory',
                            attributes: ['inwardPrice']
                        }]
                    }
                ]
            });

            const servicesReport = serviceInvoices.map(inv => {
                let partsCost = 0;
                inv.items.forEach(item => {
                    const cost = parseFloat(item.inventory?.inwardPrice || 0);
                    partsCost += cost * item.quantity;
                });

                return {
                    id: inv.id,
                    jobNo: inv.inward?.inwardNo,
                    invoiceNo: inv.invoiceNo,
                    date: inv.invoiceDate || inv.createdAt,
                    customer: inv.inward?.customerName,
                    revenue: parseFloat(inv.finalAmount),
                    cost: partsCost,
                    profit: parseFloat(inv.finalAmount) - partsCost,
                    type: 'SERVICE'
                };
            });

            // Combined list sorted by date
            const combined = [...salesReport, ...servicesReport].sort((a, b) => new Date(b.date) - new Date(a.date));

            // Summary
            const totalSalesRevenue = salesReport.reduce((sum, s) => sum + s.revenue, 0);
            const totalSalesCost = salesReport.reduce((sum, s) => sum + s.cost, 0);

            const totalServiceRevenue = servicesReport.reduce((sum, s) => sum + s.revenue, 0);
            const totalServiceCost = servicesReport.reduce((sum, s) => sum + s.cost, 0);

            res.json({
                summary: {
                    totalRevenue: totalSalesRevenue + totalServiceRevenue,
                    totalCost: totalSalesCost + totalServiceCost,
                    totalProfit: (totalSalesRevenue + totalServiceRevenue) - (totalSalesCost + totalServiceCost),
                    salesRevenue: totalSalesRevenue,
                    salesCost: totalSalesCost,
                    salesProfit: totalSalesRevenue - totalSalesCost,
                    serviceRevenue: totalServiceRevenue,
                    serviceCost: totalServiceCost,
                    serviceProfit: totalServiceRevenue - totalServiceCost
                },
                combined,
                sales: salesReport,
                services: servicesReport
            });

        } catch (error) {
            console.error('Error generating profit report:', error);
            res.status(500).json({ message: 'Error generating profit report', error: error.message });
        }
    }
}

module.exports = ReportController;
