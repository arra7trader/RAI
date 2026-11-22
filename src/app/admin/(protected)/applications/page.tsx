import { ApplicationReviewActions } from "@/components/application-review-actions";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const db = getDb();
  const [applications, qrCodes] = await Promise.all([
    db.storeApplication.findMany({ orderBy: { submittedAt: "desc" }, take: 100 }),
    db.qrCode.findMany({ where: { status: "UNASSIGNED", tenantId: null }, orderBy: { createdAt: "asc" }, take: 200, select: { id: true, code: true, label: true } }),
  ]);

  return <>
    <div className="admin-page-heading">
      <span className="admin-eyebrow">Aktivasi klien</span>
      <h1>Pengajuan toko</h1>
      <p>{applications.filter((item) => item.status === "PENDING").length} pengajuan menunggu keputusan. Tenant baru hanya aktif setelah disetujui.</p>
    </div>
    <div className="application-list">
      {applications.map((application) => <article className="admin-card application-card" key={application.id}>
        <div className="application-card-heading">
          <div><span className="admin-eyebrow">{application.category} · Paket {application.planTier}</span><h2>{application.businessName}</h2><p>Diajukan {application.submittedAt.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}</p></div>
          <span className={`admin-status ${application.status === "APPROVED" ? "success" : application.status === "REJECTED" ? "inactive" : ""}`}>{application.status}</span>
        </div>
        <div className="application-details">
          <span><strong>Pemilik:</strong> {application.ownerName}</span>
          <span><strong>Email:</strong> {application.ownerEmail}</span>
          <span><strong>WhatsApp:</strong> {application.phoneWa}</span>
          {application.staffEmail && <span><strong>Kasir:</strong> {application.staffName} · {application.staffEmail}</span>}
          {application.address && <span><strong>Alamat:</strong> {application.address}</span>}
          {application.mapsUrl && <a className="admin-table-link" href={application.mapsUrl} target="_blank" rel="noreferrer">Lokasi Maps ↗</a>}
          {application.googleReviewUrl && <a className="admin-table-link" href={application.googleReviewUrl} target="_blank" rel="noreferrer">Ulasan Google ↗</a>}
          {application.reviewNote && <span><strong>Catatan:</strong> {application.reviewNote}</span>}
        </div>
        {application.status === "PENDING" && <ApplicationReviewActions applicationId={application.id} suggestedSlug={application.slug} qrCodes={qrCodes} />}
        {application.status === "APPROVED" && application.tenantId && <p className="admin-field-help">Tenant telah dibuat: <code>{application.slug}</code>.</p>}
      </article>)}
      {!applications.length && <div className="empty-menu"><h2>Belum ada pengajuan toko</h2><p>Pengajuan yang masuk akan tampil di sini untuk diperiksa.</p></div>}
    </div>
  </>;
}
