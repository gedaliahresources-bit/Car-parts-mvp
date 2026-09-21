import type { ListingDetail } from "@/lib/listings";
import { fitmentsToText } from "@/lib/listings";
import { createListingAction, updateListingAction } from "@/app/actions";
import styles from "./ListingForm.module.css";

type Props = {
  sellerId: number;
  listing?: ListingDetail;
};

export function ListingForm({ sellerId, listing }: Props) {
  const isEdit = Boolean(listing);
  const action = isEdit ? updateListingAction : createListingAction;

  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="seller_id" value={sellerId} />
      {listing && <input type="hidden" name="listing_id" value={listing.id} />}

      <label>
        Part name *
        <input
          name="part_name"
          required
          defaultValue={listing?.part_name ?? ""}
          placeholder="e.g. alternator"
        />
      </label>

      <label>
        Part number
        <input
          name="part_number"
          defaultValue={listing?.part_number ?? ""}
          placeholder="OEM or aftermarket #"
        />
      </label>

      <label>
        Condition *
        <select
          name="condition"
          defaultValue={listing?.condition ?? "used"}
          required
        >
          <option value="new">new</option>
          <option value="used">used</option>
          <option value="refurbished">refurbished</option>
          <option value="core">core</option>
        </select>
      </label>

      <label>
        Location *
        <input
          name="location"
          required
          defaultValue={listing?.location ?? ""}
          placeholder="City, ST"
        />
      </label>

      <label>
        Price (text only)
        <input
          name="price_text"
          defaultValue={listing?.price_text ?? ""}
          placeholder="$75"
        />
      </label>

      <label>
        Notes
        <textarea
          name="notes"
          rows={2}
          defaultValue={listing?.notes ?? ""}
          placeholder="Optional"
        />
      </label>

      <label>
        Fitments (one per line: YEAR Make Model)
        <textarea
          name="fitments"
          rows={4}
          defaultValue={listing ? fitmentsToText(listing.fitments) : ""}
          placeholder={"2015 Honda Civic\n2014 Honda Civic"}
        />
      </label>

      <label>
        Status
        <select name="active" defaultValue={listing?.active === false ? "0" : "1"}>
          <option value="1">Active (in buyer search)</option>
          <option value="0">Inactive (hidden from search)</option>
        </select>
      </label>

      <button type="submit">{isEdit ? "Save changes" : "Create listing"}</button>
    </form>
  );
}
