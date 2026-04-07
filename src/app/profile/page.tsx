import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN!;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID!;

async function getFavoriteEntryFeeIds(userId: string): Promise<string[]> {
  const formula = encodeURIComponent(`{clerk_user_id} = "${userId}"`);
  const res = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Favorites?filterByFormula=${formula}`,
    {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
      cache: "no-store",
    }
  );
  if (!res.ok) return [];
  const data = await res.json().catch(() => ({}));
  return (data.records ?? [])
    .map((r: { fields: { race_slug1?: string[] } }) => r.fields.race_slug1?.[0])
    .filter(Boolean) as string[];
}

async function getRaceDetails(recordIds: string[]) {
  if (recordIds.length === 0) return [];
  const formula = encodeURIComponent(
    `OR(${recordIds.map((id) => `RECORD_ID()="${id}"`).join(",")})`
  );
  const res = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent("Entry Fees")}?filterByFormula=${formula}&view=entry_fees_public`,
    {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
      cache: "no-store",
    }
  );
  if (!res.ok) return [];
  const data = await res.json().catch(() => ({}));
  return data.records ?? [];
}

export const metadata = {
  title: "My Profile — DiscoverTrailRaces",
};

export default async function ProfilePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const entryFeeIds = await getFavoriteEntryFeeIds(userId);
  const raceRecords = await getRaceDetails(entryFeeIds);

  type AirtableAttachment = { url: string; thumbnails?: Record<string, { url: string }> };
  const races = raceRecords.map((r: { fields: Record<string, unknown> }) => {
    const f = r.fields;
    const slugs = (f["Race Slug"] as string[] | undefined) ?? [];
    const slug = slugs[0] ?? "";
    const idField = (f["ID"] as string | undefined) ?? "";
    const dashIdx = idField.lastIndexOf(" – ");
    const name = dashIdx > -1 ? idField.slice(0, dashIdx) : idField;
    const country = Array.isArray(f["LKP_country"]) ? f["LKP_country"][0] : (f["LKP_country"] as string | undefined) ?? "";
    const epk = f["AUTO €/km"] as number | undefined;
    const imgs =
      (f["LKP_featured_image"] as AirtableAttachment[] | undefined) ??
      (f["temporary_image"] as AirtableAttachment[] | undefined) ??
      [];
    const img = imgs[0];
    const imgUrl = img?.thumbnails?.large?.url ?? img?.thumbnails?.full?.url ?? img?.url ?? null;
    return { slug, name, country, epk, imgUrl };
  });

  return (
    <main className="min-h-screen bg-neutral-50">
      <nav className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/images/logo_white.png"
            alt="DiscoverTrailRaces"
            className="h-8"
            style={{ filter: "invert(1)" }}
          />
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/cost" className="text-sm text-neutral-600 hover:text-neutral-900">
            ← Cost Index
          </Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-neutral-900 mb-1">
            {user?.firstName ? `${user.firstName}'s races` : "Saved races"}
          </h1>
          <p className="text-neutral-500 text-sm">
            {user?.emailAddresses?.[0]?.emailAddress}
          </p>
        </div>

        {races.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-neutral-300 rounded-2xl bg-white">
            <div className="text-5xl mb-4">♡</div>
            <h2 className="text-lg font-semibold text-neutral-700 mb-2">No saved races yet</h2>
            <p className="text-neutral-400 text-sm mb-6">
              Tap the heart on any race to save it here.
            </p>
            <Link
              href="/cost"
              className="inline-block bg-[#1a2e4a] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#243d5e] transition-colors"
            >
              Browse races
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {races.map((race) => (
              <li key={race.slug || race.name}>
                <Link
                  href={race.slug ? `/races/${race.slug}` : "/cost"}
                  className="flex items-center gap-4 bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-md transition-shadow group"
                >
                  {race.imgUrl ? (
                    <div className="relative w-20 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-neutral-100">
                      <Image
                        src={race.imgUrl}
                        alt={race.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-14 flex-shrink-0 rounded-lg bg-neutral-100" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-900 truncate group-hover:text-[#1a2e4a]">
                      {race.name}
                    </p>
                    <p className="text-sm text-neutral-500">{race.country}</p>
                  </div>
                  {race.epk != null && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-neutral-900">
                        €{race.epk.toFixed(2)}
                      </p>
                      <p className="text-xs text-neutral-400">/km</p>
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8 pt-8 border-t border-neutral-200 text-xs text-neutral-400 space-y-1">
          <p>
            <strong className="text-neutral-500">Your data & GDPR:</strong> Your email is stored securely by Clerk in the EU. We store only an anonymous user ID alongside your saved race preferences — no personal information is kept in our race database.
          </p>
          <p>
            To delete your account and all associated data, email us or use the account settings below.
          </p>
        </div>
      </div>
    </main>
  );
}
