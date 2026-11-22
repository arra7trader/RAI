import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { getOwnerTenantScope } from "@/lib/owner-tenant-scope";

export const runtime = "nodejs";

function jakartaStart(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day) - 7 * 60 * 60 * 1000);
  const check = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
  return check === date ? value : null;
}

function todayJakarta() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function cell(value: string) {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function setupSheet(sheet: ExcelJS.Worksheet, widths: number[]) {
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF247F7C" } };
  widths.forEach((width, index) => { sheet.getColumn(index + 1).width = width; });
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: widths.length } };
}

export async function GET(request: NextRequest) {
  const user = await requireUser("OWNER");
  const scope = await getOwnerTenantScope(user.id, user.tenantId);
  if (!scope.tenantIds.length) return NextResponse.json({ error: "Toko tidak ditemukan." }, { status: 404 });

  const toDate = request.nextUrl.searchParams.get("to") ?? todayJakarta();
  const today = todayJakarta();
  const defaultFrom = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
  const fromDate = request.nextUrl.searchParams.get("from") ?? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(defaultFrom);
  const start = jakartaStart(fromDate);
  const endDay = jakartaStart(toDate);
  if (!start || !endDay || toDate > today || fromDate > toDate) return NextResponse.json({ error: "Tanggal laporan tidak valid." }, { status: 400 });
  const end = new Date(endDay.getTime() + 24 * 60 * 60 * 1000);
  if (end.getTime() - start.getTime() > 90 * 24 * 60 * 60 * 1000) return NextResponse.json({ error: "Rentang ekspor dibatasi hingga 90 hari." }, { status: 400 });

  const tenantId = { in: scope.tenantIds };
  const dayFrom = fromDate;
  const dayTo = toDate;
  const db = getDb();
  const [orders, shifts, movements, attendance] = await Promise.all([
    db.order.findMany({ where: { tenantId, status: "PAID", createdAt: { gte: start, lt: end } }, orderBy: { createdAt: "asc" }, take: 10_001, select: { id: true, createdAt: true, paymentMethod: true, subtotal: true, discount: true, total: true, tenant: { select: { name: true } }, staff: { select: { name: true } }, items: { select: { name: true, quantity: true, unitPrice: true, lineTotal: true } } } }),
    db.cashDrawerShift.findMany({ where: { tenantId, OR: [{ openedAt: { gte: start, lt: end } }, { closedAt: { gte: start, lt: end } }] }, orderBy: { openedAt: "asc" }, take: 10_001, select: { openedAt: true, closedAt: true, openingCash: true, countedCash: true, expectedCash: true, tenant: { select: { name: true } }, openedBy: { select: { name: true } }, closedBy: { select: { name: true } } } }),
    db.cashDrawerMovement.findMany({ where: { tenantId, createdAt: { gte: start, lt: end } }, orderBy: { createdAt: "asc" }, take: 10_001, select: { createdAt: true, type: true, amount: true, note: true, tenant: { select: { name: true } }, shift: { select: { openedAt: true } } } }),
    db.attendance.findMany({ where: { tenantId, dayKey: { gte: dayFrom, lte: dayTo } }, orderBy: [{ dayKey: "asc" }, { checkInAt: "asc" }], take: 10_001, select: { dayKey: true, checkInAt: true, checkOutAt: true, checkInDistance: true, checkOutDistance: true, tenant: { select: { name: true } }, user: { select: { name: true } } } }),
  ]);
  const itemCount = orders.reduce((total, order) => total + order.items.length, 0);
  if ([orders.length, shifts.length, movements.length, attendance.length].some((count) => count > 10_000) || itemCount > 50_000) {
    return NextResponse.json({ error: "Laporan terlalu besar untuk satu file. Kurangi rentang tanggal." }, { status: 413 });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "RAI Platform";
  workbook.created = new Date();
  workbook.properties.date1904 = false;
  const transactions = workbook.addWorksheet("Transaksi");
  transactions.addRow(["ID transaksi", "Tanggal", "Cabang", "Kasir", "Item", "Subtotal (Rp)", "Diskon (Rp)", "Total (Rp)", "Pembayaran"]);
  for (const order of orders) transactions.addRow([cell(order.id), order.createdAt, cell(order.tenant.name), cell(order.staff?.name ?? ""), cell(order.items.map((item) => `${item.name} ×${item.quantity}`).join(", ")), order.subtotal, order.discount, order.total, cell(order.paymentMethod)]);
  setupSheet(transactions, [38, 21, 26, 22, 48, 19, 17, 17, 17]);
  transactions.getColumn(2).numFmt = "dd/mm/yyyy hh:mm";
  for (const index of [6, 7, 8]) transactions.getColumn(index).numFmt = '"Rp" #,##0';

  const itemsSheet = workbook.addWorksheet("Item Transaksi");
  itemsSheet.addRow(["ID transaksi", "Tanggal", "Cabang", "Kasir", "Item", "Jumlah", "Harga satuan (Rp)", "Total item (Rp)"]);
  for (const order of orders) for (const item of order.items) itemsSheet.addRow([cell(order.id), order.createdAt, cell(order.tenant.name), cell(order.staff?.name ?? ""), cell(item.name), item.quantity, item.unitPrice, item.lineTotal]);
  setupSheet(itemsSheet, [38, 21, 26, 22, 34, 12, 20, 19]);
  itemsSheet.getColumn(2).numFmt = "dd/mm/yyyy hh:mm";
  for (const index of [7, 8]) itemsSheet.getColumn(index).numFmt = '"Rp" #,##0';

  const cash = workbook.addWorksheet("Kas Laci");
  cash.addRow(["Mulai shift", "Akhir shift", "Cabang", "Dibuka oleh", "Ditutup oleh", "Modal awal (Rp)", "Kas seharusnya (Rp)", "Kas dihitung (Rp)", "Selisih (Rp)"]);
  for (const shift of shifts) cash.addRow([shift.openedAt, shift.closedAt, cell(shift.tenant.name), cell(shift.openedBy.name), cell(shift.closedBy?.name ?? ""), shift.openingCash, shift.expectedCash, shift.countedCash, shift.countedCash !== null && shift.expectedCash !== null ? shift.countedCash - shift.expectedCash : null]);
  setupSheet(cash, [21, 21, 26, 22, 22, 18, 22, 19, 17]);
  cash.getColumn(1).numFmt = "dd/mm/yyyy hh:mm";
  cash.getColumn(2).numFmt = "dd/mm/yyyy hh:mm";
  for (const index of [6, 7, 8, 9]) cash.getColumn(index).numFmt = '"Rp" #,##0';

  const cashMovements = workbook.addWorksheet("Mutasi Kas");
  cashMovements.addRow(["Tanggal", "Cabang", "Mulai shift", "Jenis", "Jumlah (Rp)", "Catatan"]);
  for (const movement of movements) cashMovements.addRow([movement.createdAt, cell(movement.tenant.name), movement.shift.openedAt, cell(movement.type), movement.amount, cell(movement.note)]);
  setupSheet(cashMovements, [21, 26, 21, 16, 18, 48]);
  cashMovements.getColumn(1).numFmt = "dd/mm/yyyy hh:mm";
  cashMovements.getColumn(3).numFmt = "dd/mm/yyyy hh:mm";
  cashMovements.getColumn(5).numFmt = '"Rp" #,##0';

  const attendanceSheet = workbook.addWorksheet("Absensi");
  attendanceSheet.addRow(["Tanggal", "Cabang", "Nama", "Masuk", "Keluar", "Jarak masuk (m)", "Jarak keluar (m)"]);
  for (const item of attendance) attendanceSheet.addRow([cell(item.dayKey), cell(item.tenant.name), cell(item.user.name), item.checkInAt, item.checkOutAt, item.checkInDistance, item.checkOutDistance]);
  setupSheet(attendanceSheet, [15, 26, 22, 21, 21, 19, 19]);
  attendanceSheet.getColumn(4).numFmt = "dd/mm/yyyy hh:mm";
  attendanceSheet.getColumn(5).numFmt = "dd/mm/yyyy hh:mm";

  const output = new Uint8Array(await workbook.xlsx.writeBuffer());
  return new NextResponse(output, {
    status: 200,
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="rai-laporan-${fromDate}-${toDate}.xlsx"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
