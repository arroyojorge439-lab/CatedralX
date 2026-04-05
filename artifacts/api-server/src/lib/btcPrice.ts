interface BTCPriceData {
  price: number;
  change24h: number;
  fetchedAt: number;
}

let cached: BTCPriceData | null = null;
const CACHE_TTL = 30_000;

export async function getBTCPrice(): Promise<{ price: number; change24h: number }> {
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return { price: cached.price, change24h: cached.change24h };
  }

  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true"
    );
    const data = (await response.json()) as Record<string, Record<string, number>>;
    const price = data.bitcoin?.usd || 0;
    const change24h = data.bitcoin?.usd_24h_change || 0;

    cached = { price, change24h, fetchedAt: Date.now() };
    return { price, change24h };
  } catch {
    if (cached) return { price: cached.price, change24h: cached.change24h };
    return { price: 0, change24h: 0 };
  }
}
