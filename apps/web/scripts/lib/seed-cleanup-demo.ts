import type { Payload } from "payload";

export async function cleanupDemo(payload: Payload) {
  console.log("  → finding demo dealers");
  const dealers = await payload.find({
    collection: "dealers",
    where: { is_demo: { equals: true } },
    limit: 1000,
  });
  for (const d of dealers.docs) {
    await payload.delete({ collection: "dealers", id: d.id });
  }
  console.log(`  ✓ ${dealers.docs.length} demo dealers deleted`);

  console.log("  → finding demo listings");
  const listings = await payload.find({
    collection: "used_car_listings",
    where: { is_demo: { equals: true } },
    limit: 1000,
  });
  for (const l of listings.docs) {
    await payload.delete({ collection: "used_car_listings", id: l.id });
  }
  console.log(`  ✓ ${listings.docs.length} demo listings deleted`);

  console.log("  → finding demo leads (@example.com)");
  const leads = await payload.find({
    collection: "lead_requests",
    where: { customer_email: { contains: "@example.com" } },
    limit: 1000,
  });
  for (const lead of leads.docs) {
    await payload.delete({ collection: "lead_requests", id: lead.id });
  }
  console.log(`  ✓ ${leads.docs.length} demo leads deleted`);
}
