import { QRCodeSVG } from "qrcode.react";
import { toast } from "../lib/toast";

export default function ShareTab() {
  const link = window.location.href.split("#")[0];
  return (
    <div className="card" style={{ textAlign: "center" }}>
      <h3>Your ordering page</h3>
      <div id="qr-canvas-wrap">
        <QRCodeSVG value={link} size={200} />
      </div>
      <p className="small" style={{ wordBreak: "break-all", marginTop: 10 }}>
        {link}
      </p>
      <button
        className="btn secondary"
        onClick={() => navigator.clipboard.writeText(link).then(() => toast("Link copied!"))}
      >
        Copy Link
      </button>
    </div>
  );
}
