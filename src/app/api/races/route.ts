import { airtableFetchAll } from "@/lib/airtable";
import { AIRTABLE } from "@/lib/airtableConfig";

export const revalidate = 3600;

export async function GET() {
  const records = await airtableFetchAll(
    AIRTABLE.TABLES.ENTRY_FEES,
    {
      view: AIRTABLE.VIEWS.ENTRY_FEES_PUBLIC,
      filterByFormula: "NOT({series_stage}=TRUE())",
      "sort[0][field]": "AUTO €/km",
      "sort[0][direction]": "asc",
    },
    3600,
  );

  return Response.json({ records, total: records.length });
}
