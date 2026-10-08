/** Kirkify is a Oso-Ahia toy and is not part of Oso-Ahia. */
export function POST() {
  return Response.json(
    { error: "Kirkify is not available in Oso-Ahia." },
    { status: 404 },
  );
}
