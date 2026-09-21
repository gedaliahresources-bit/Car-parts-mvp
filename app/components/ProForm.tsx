import type { ServicePro } from "@/lib/services/pros";
import { TRADE_OPTIONS } from "@/lib/services/pros";
import { createProAction, updateProAction } from "@/app/actions";
import styles from "./ListingForm.module.css";

type Props = {
  ownerUserId: number;
  pro?: ServicePro;
};

export function ProForm({ ownerUserId, pro }: Props) {
  const isEdit = Boolean(pro);
  const action = isEdit ? updateProAction : createProAction;

  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="owner_user_id" value={ownerUserId} />
      {pro && <input type="hidden" name="pro_id" value={pro.id} />}

      <label>
        Business name *
        <input
          name="business_name"
          required
          defaultValue={pro?.business_name ?? ""}
          placeholder="e.g. Atlanta Plumbing Co"
        />
      </label>

      <label>
        Trade(s) *
        <input
          name="trades"
          required
          list="pro-trade-options"
          defaultValue={pro?.trades ?? ""}
          placeholder="plumbing, remodeling"
        />
        <datalist id="pro-trade-options">
          {TRADE_OPTIONS.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </label>
      <p style={{ margin: 0, fontSize: "0.8rem", color: "#666" }}>
        Comma-separated if multiple trades.
      </p>

      <label>
        Service area *
        <input
          name="service_area"
          required
          defaultValue={pro?.service_area ?? ""}
          placeholder="Atlanta, GA"
        />
      </label>

      <label>
        Years experience *
        <input
          name="years_experience"
          type="number"
          min={0}
          required
          defaultValue={pro?.years_experience ?? 0}
        />
      </label>

      <label>
        Specialties
        <input
          name="specialties"
          defaultValue={pro?.specialties ?? ""}
          placeholder="Water heaters, drain cleaning"
        />
      </label>

      <label>
        Notes
        <textarea
          name="notes"
          rows={2}
          defaultValue={pro?.notes ?? ""}
          placeholder="Optional"
        />
      </label>

      <label>
        Contact email
        <input
          name="contact_email"
          type="email"
          defaultValue={pro?.contact_email ?? ""}
        />
      </label>

      <label>
        Contact phone
        <input
          name="contact_phone"
          defaultValue={pro?.contact_phone ?? ""}
        />
      </label>

      <label>
        License status *
        <select
          name="license_status"
          required
          defaultValue={pro?.license_status ?? "unverified"}
        >
          <option value="unverified">unverified</option>
          <option value="verified">verified</option>
          <option value="not_applicable">not_applicable</option>
        </select>
      </label>
      <p style={{ margin: 0, fontSize: "0.8rem", color: "#666" }}>
        Default is <strong>unverified</strong>. Choose verified only when you
        can name a source (license # + board name + URL). Never imply licensed
        without verification.
      </p>

      <label>
        License number (required if verified)
        <input
          name="license_number"
          defaultValue={pro?.license_number ?? ""}
        />
      </label>

      <label>
        License source name (required if verified)
        <input
          name="license_source_name"
          defaultValue={pro?.license_source_name ?? ""}
          placeholder="State license board name"
        />
      </label>

      <label>
        License source URL (required if verified)
        <input
          name="license_source_url"
          type="url"
          defaultValue={pro?.license_source_url ?? ""}
          placeholder="https://…"
        />
      </label>

      <label>
        License checked on (YYYY-MM-DD)
        <input
          name="license_checked_on"
          defaultValue={pro?.license_checked_on ?? ""}
          placeholder="2026-03-15"
        />
      </label>

      <label>
        Active
        <select name="active" defaultValue={pro?.active === false ? "0" : "1"}>
          <option value="1">active (shown in search)</option>
          <option value="0">inactive (hidden from search)</option>
        </select>
      </label>

      <button type="submit">{isEdit ? "Save profile" : "Create profile"}</button>
    </form>
  );
}
