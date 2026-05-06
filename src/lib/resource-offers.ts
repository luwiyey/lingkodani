export function createResourceOfferMessage(resourceName: string, stock?: number) {
  const stockNote =
    typeof stock === "number" && Number.isFinite(stock)
      ? ` May humigit-kumulang na ${stock} yunit na available ngayon.`
      : "";

  return `May available na ${resourceName} mula sa barangay para sa inyong pangangailangan.${stockNote} Makipag-ugnayan po sa barangay hall o AEW para sa susunod na hakbang sa pag-claim.`;
}
