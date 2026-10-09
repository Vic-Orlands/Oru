/** Kirkify is a Ọru toy and is not part of Ọru. */
export function POST() {
  return Response.json(
    { error: "Kirkify is not available in Ọru." },
    { status: 404 },
  );
}
